using Ecommerce.API.Data;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.API.Services;

public sealed class PaypalInventoryReservationCleanupService : BackgroundService
{
    private const int BatchSize = 100;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<PaypalInventoryReservationCleanupService> _logger;

    public PaypalInventoryReservationCleanupService(
        IServiceScopeFactory scopeFactory,
        ILogger<PaypalInventoryReservationCleanupService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(1));
        do
        {
            try
            {
                await ReleaseExpiredReservationsAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, "No se pudieron liberar las reservas vencidas de inventario.");
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }

    private async Task ReleaseExpiredReservationsAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var ahoraUtc = DateTime.UtcNow;
        var ordenesExpiradas = await context.Ordenes
            .Where(order => order.InventarioReservado &&
                order.InventarioReservaExpiraUtc <= ahoraUtc &&
                (order.EstadoOrden == "Pendiente" ||
                 order.EstadoOrden == "Pendiente Pago PayPal" ||
                 order.EstadoOrden == "Pago no completado"))
            .OrderBy(order => order.InventarioReservaExpiraUtc)
            .Select(order => order.Id)
            .Take(BatchSize)
            .ToListAsync(cancellationToken);

        foreach (var orderId in ordenesExpiradas)
        {
            await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                var reservationReleased = await context.Ordenes
                    .Where(order => order.Id == orderId &&
                        order.InventarioReservado &&
                        order.InventarioReservaExpiraUtc <= ahoraUtc &&
                        (order.EstadoOrden == "Pendiente" ||
                         order.EstadoOrden == "Pendiente Pago PayPal" ||
                         order.EstadoOrden == "Pago no completado"))
                    .ExecuteUpdateAsync(updates => updates
                        .SetProperty(order => order.EstadoOrden, "Pago no completado")
                        .SetProperty(order => order.InventarioReservado, false), cancellationToken);

                if (reservationReleased == 0)
                {
                    await transaction.RollbackAsync(cancellationToken);
                    continue;
                }

                var details = await context.OrdenesDetalles
                    .Where(detail => detail.OrdenId == orderId)
                    .AsNoTracking()
                    .ToListAsync(cancellationToken);
                foreach (var detail in details)
                {
                    var stockRestored = await context.Productos
                        .Where(product => product.ProductoId == detail.ProductoId &&
                            product.Stock <= int.MaxValue - detail.Cantidad)
                        .ExecuteUpdateAsync(updates =>
                            updates.SetProperty(product => product.Stock, product => product.Stock + detail.Cantidad),
                            cancellationToken);
                    if (stockRestored != 1)
                        throw new InvalidOperationException($"No se pudo restaurar el inventario del producto {detail.ProductoId}.");
                }

                await transaction.CommitAsync(cancellationToken);
                _logger.LogInformation("Se liberó la reserva de inventario de la orden {OrderId}.", orderId);
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception exception)
            {
                await transaction.RollbackAsync(cancellationToken);
                _logger.LogError(exception, "No se pudo liberar la reserva de inventario de la orden {OrderId}.", orderId);
            }
        }
    }
}
