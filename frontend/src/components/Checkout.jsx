import { useState } from 'react'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'
import { capturePayPalOrder, createPayPalOrder } from '../lib/api'
import './Checkout.css'

const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID

/**
 * Botones de PayPal conectados al PaypalController (.NET).
 *
 * @param {Object} props
 * @param {number} props.usuarioId - ID del usuario autenticado
 * @param {number} props.direccionEnvioId - ID de la dirección de envío
 * @param {{ productoId: number, cantidad: number }[]} props.items - Carrito
 * @param {(result: { mensaje: string, estado: string }) => void} [props.onSuccess]
 * @param {(error: Error) => void} [props.onError]
 */
export default function Checkout({
  usuarioId,
  direccionEnvioId,
  items,
  onSuccess,
  onError,
}) {
  const [statusMessage, setStatusMessage] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  if (!paypalClientId) {
    return (
      <div className="checkout checkout--error" role="alert">
        <p>
          Falta configurar <code>VITE_PAYPAL_CLIENT_ID</code> en el archivo{' '}
          <code>.env</code> (usa el mismo Client ID de Sandbox que en{' '}
          <code>appsettings.json</code>).
        </p>
      </div>
    )
  }

  const checkoutPayload = {
    usuarioId,
    direccionEnvioId,
    items: items.map((item) => ({
      productoId: item.productoId,
      cantidad: item.cantidad,
    })),
  }

  const handleCreateOrder = async () => {
    setStatusMessage('Calculando total y registrando orden…')
    setIsProcessing(true)

    try {
      const { orderId } = await createPayPalOrder(checkoutPayload)
      setStatusMessage('')
      return orderId
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Error desconocido')
      setStatusMessage(err.message)
      onError?.(err)
      throw err
    } finally {
      setIsProcessing(false)
    }
  }

  const handleApprove = async (data) => {
    setStatusMessage('Capturando pago e inventario…')
    setIsProcessing(true)

    try {
      const result = await capturePayPalOrder(data.orderID)
      setStatusMessage(result.mensaje)
      onSuccess?.(result)
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Error desconocido')
      setStatusMessage(err.message)
      onError?.(err)
      throw err
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePayPalError = (err) => {
    const message =
      err?.message ?? 'Ocurrió un error con el flujo de PayPal.'
    setStatusMessage(message)
    onError?.(new Error(message))
  }

  return (
    <div className="checkout">
      <PayPalScriptProvider
        options={{
          clientId: paypalClientId,
          currency: 'MXN',
          intent: 'capture',
        }}
      >
        <PayPalButtons
          style={{ layout: 'vertical', color: 'gold', shape: 'rect' }}
          disabled={isProcessing || items.length === 0}
          createOrder={handleCreateOrder}
          onApprove={handleApprove}
          onError={handlePayPalError}
          onCancel={() =>
            setStatusMessage('Pago cancelado. Puedes intentarlo de nuevo.')
          }
        />
      </PayPalScriptProvider>

      {statusMessage && (
        <p
          className={`checkout__status ${
            statusMessage.includes('procesada') ||
            statusMessage.includes('¡Compra')
              ? 'checkout__status--success'
              : ''
          }`}
          role="status"
        >
          {statusMessage}
        </p>
      )}
    </div>
  )
}
