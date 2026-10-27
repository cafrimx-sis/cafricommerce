import { useState } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import api from '../lib/api';
import { paypalClientId } from '../lib/deploymentConfig';
import toast from 'react-hot-toast';
import ShippingAddressView from './ShippingAddressView';

const initialPayPalOptions = {
  "client-id": paypalClientId,
  currency: "MXN",
  intent: "capture",
};

export default function Checkout({ cart = [], total = 0, clearCart, user, onBackToCart }) {
  const [step, setStep] = useState(1);
  const [pagoPaypalExitoso, setPagoPaypalExitoso] = useState(false);

  const [formData, setFormData] = useState({
    calle: '',
    numeroExterior: '',
    numeroInterior: '',
    colonia: '',
    ciudad: '',
    estado: '',
    codigoPostal: '',
    telefonoContacto: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const idUsuarioDetectado = user?.id || user?.usuarioId || user?.userId;
  const token = localStorage.getItem('token'); // Verificación adicional de sesión activa en cliente

  // 🛡️ Protección de ruta: Si no hay sesión activa ni usuario detectado, bloquear el checkout
  if (!idUsuarioDetectado && !token) {
    return (
      <div className="checkout-screen" style={{ padding: 'clamp(16px, 4vw, 32px)', boxSizing: 'border-box' }}>
        <div className="checkout-panel checkout-success" style={{ maxWidth: '520px', margin: '20px auto', background: '#ffffff', padding: '28px', borderRadius: '20px', boxShadow: 'var(--shadow-soft)', border: '1px solid var(--line)', textAlign: 'center' }}>
          <span style={{ fontSize: '2.2rem' }}>🔒</span>
          <h2 style={{ color: '#1e293b', margin: '8px 0 4px 0', fontSize: '1.35rem' }}>Inicia sesión para continuar</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px' }}>Necesitas iniciar sesión o registrarte en tu cuenta para poder procesar tu compra de manera segura.</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onBackToCart}
              style={{ padding: '12px 16px', backgroundColor: '#e2e8f0', color: '#4a5568', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.95rem', cursor: 'pointer', flex: 1 }}
            >
              Regresar
            </button>
            <button
              type="button"
              onClick={() => window.location.href = '/login'}
              style={{ padding: '12px 16px', backgroundColor: '#0070ba', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.95rem', cursor: 'pointer', flex: 1 }}
            >
              Iniciar Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  const construirPayload = () => ({
    usuarioId: idUsuarioDetectado ? Number(idUsuarioDetectado) : 0, 
    direccionEnvioId: 0,
    ...formData,
    items: cart.map(item => ({
      productoId: item.productoId || item.id,
      cantidad: item.cantidad
    }))
  });

  const handleCreatePayPalOrder = async () => {
    try {
      const response = await api.post('/paypal/create-order', {
        ...construirPayload(),
        totalAmount: total
      });
      return response.data.id;
    } catch (err) {
      console.error("Error al crear la orden de PayPal en el backend:", err);
      toast.error("No se pudo iniciar el proceso de pago con PayPal.");
      throw err;
    }
  };

  const handleApprovePayPalOrder = async (data) => {
    try {
      const response = await api.post('/paypal/capture-order', {
        orderId: data.orderID
      });

      if (response.data.success || response.status === 200) {
        toast.success("¡Pago con PayPal procesado con éxito!");
        setPagoPaypalExitoso(true);
        clearCart();
      }
    } catch (err) {
      console.error("Error al capturar el pago de PayPal:", err);
      toast.error("El pago fue autorizado pero ocurrió un error al registrarlo en el servidor.");
    }
  };

  if (pagoPaypalExitoso) {
    return (
      <div style={{ padding: '16px', boxSizing: 'border-box' }}>
        <div style={{ maxWidth: '520px', margin: '20px auto', background: '#ffffff', padding: '28px', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <span style={{ fontSize: '2.2rem' }}>🎉</span>
          <h2 style={{ color: 'var(--brand-800)', margin: '8px 0 4px 0', fontSize: '1.35rem' }}>¡Pago con PayPal Completado!</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px' }}>Tu orden ha sido pagada y registrada correctamente.</p>
          <button 
            type="button"
            onClick={onBackToCart} 
            style={{ padding: '12px 20px', background: 'linear-gradient(135deg, var(--brand-800), var(--brand-700))', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '0.95rem', cursor: 'pointer', width: '100%' }}
          >
            Regresar a la tienda
          </button>
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <ShippingAddressView 
        formData={formData} 
        handleChange={handleChange} 
        setFormData={setFormData}
        onNext={(e) => { e.preventDefault(); setStep(2); }} 
        onBack={onBackToCart} 
      />
    );
  }

  return (
    <div className="checkout-screen" style={{ padding: 'clamp(16px, 4vw, 32px)', boxSizing: 'border-box' }}>
      <div className="checkout-panel" style={{ maxWidth: '600px', margin: '20px auto', background: '#ffffff', padding: 'clamp(20px, 4vw, 32px)', borderRadius: '20px', border: '1px solid var(--line)', boxShadow: 'var(--shadow-soft)' }}>
        <span className="checkout-step-label">PASO 2 DE 2 · PAGO SEGURO</span>
        <h2 style={{ color: 'var(--brand-950)', marginTop: '10px', marginBottom: '16px' }}>Finalizar pago con PayPal</h2>
        
        <PayPalScriptProvider options={initialPayPalOptions}>
          <div>
            <p className="checkout-total">
              Total a pagar: <strong>${total.toLocaleString()} MXN</strong>
            </p>
            <div style={{ marginBottom: '16px' }}>
              <PayPalButtons 
                createOrder={handleCreatePayPalOrder}
                onApprove={handleApprovePayPalOrder}
                style={{ layout: "vertical" }}
              />
            </div>
            <button 
              type="button" 
              onClick={() => setStep(1)}
              style={{ padding: '12px 16px', backgroundColor: '#edf3f7', color: 'var(--brand-800)', border: '1px solid var(--line)', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', width: '100%' }}
            >
              ← Regresar a Dirección de Envío
            </button>
          </div>
        </PayPalScriptProvider>
      </div>
    </div>
  );
}