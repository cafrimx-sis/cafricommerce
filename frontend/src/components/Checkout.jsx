import React, { useState } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import api from '../lib/api';
import toast from 'react-hot-toast';
import ShippingAddressView from './ShippingAddressView';

const initialPayPalOptions = {
  "client-id": "AeQCT0hfVM1GHOgV24guGD-NuagB8EPaCqZNfVcyCo16TKClvMwOnU6C6fgQ3rbBZXfC1e7sEOw7zwYN",
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
      const response = await api.post('/api/paypal/create-order', {
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
      const response = await api.post('/api/paypal/capture-order', {
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
          <h2 style={{ color: '#0070ba', margin: '8px 0 4px 0', fontSize: '1.35rem' }}>¡Pago con PayPal Completado!</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px' }}>Tu orden ha sido pagada y registrada correctamente.</p>
          <button 
            type="button"
            onClick={onBackToCart} 
            style={{ padding: '12px 20px', backgroundColor: '#0070ba', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.95rem', cursor: 'pointer', width: '100%' }}
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
    <div style={{ padding: '16px', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '600px', margin: '20px auto', background: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <h2 style={{ color: '#1e293b', marginTop: 0, marginBottom: '16px' }}>Finalizar Pago con PayPal</h2>
        
        <PayPalScriptProvider options={initialPayPalOptions}>
          <div>
            <p style={{ color: '#475569', fontSize: '0.95rem', marginBottom: '16px' }}>
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
              style={{ padding: '10px 16px', backgroundColor: '#e2e8f0', color: '#4a5568', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', width: '100%' }}
            >
              ← Regresar a Dirección de Envío
            </button>
          </div>
        </PayPalScriptProvider>
      </div>
    </div>
  );
}