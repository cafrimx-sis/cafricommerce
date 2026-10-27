export default function PaymentView({ formData = {}, total = 0, loading, onBack, onPay }) {
  return (
    <div style={{ padding: '16px', boxSizing: 'border-box' }}>
      <style>{`
        .payment-container {
          max-width: 650px;
          margin: 20px auto;
          background: #ffffff;
          padding: 28px;
          border-radius: 16px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
          border: 1px solid #e2e8f0;
          box-sizing: border-box;
        }

        .payment-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }

        .payment-summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          gap: 10px;
        }

        @media (max-width: 550px) {
          .payment-container {
            padding: 18px;
            margin: 10px auto;
          }
          .payment-top {
            flex-direction: column;
            align-items: flex-start;
          }
          .payment-summary-row {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>

      <div className="payment-container">
        <div style={{ marginBottom: '20px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px' }}>
          <div className="payment-top">
            <h2 style={{ color: '#004481', margin: '0 0 5px 0', fontSize: '1.35rem' }}>2. Resumen y Pago BBVA</h2>
            <button type="button" onClick={onBack} style={{ background: 'none', border: 'none', color: '#004481', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem', padding: 0 }}>
              ← Cambiar dirección
            </button>
          </div>
          <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '0.9rem' }}>Verifica los datos de destino y genera tu orden de pago.</p>
        </div>

        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '0.95rem' }}>📍 Destino de Envío:</h4>
          <p style={{ margin: '3px 0', color: '#475569', fontSize: '0.9rem', wordBreak: 'break-word' }}>
            {formData.calle} #{formData.numeroExterior} {formData.numeroInterior ? `Int. ${formData.numeroInterior}` : ''}, Col. {formData.colonia}
          </p>
          <p style={{ margin: '3px 0', color: '#475569', fontSize: '0.9rem' }}>{formData.ciudad}, {formData.estado} C.P. {formData.codigoPostal}</p>
          <p style={{ margin: '3px 0', color: '#475569', fontSize: '0.9rem' }}>Tel: {formData.telefonoContacto}</p>
        </div>

        <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '2px solid #f1f5f9', display: 'flex', flexDirection: 'column' }}>
          <div className="payment-summary-row">
            <span style={{ color: '#475569', fontSize: '0.95rem' }}>Total a Pagar (IVA y Flete incluidos):</span>
            <span style={{ color: '#0f172a', fontSize: '1.35rem', fontWeight: 'bold' }}>${Number(total || 0).toLocaleString()} MXN</span>
          </div>

          <button 
            type="button"
            onClick={onPay}
            disabled={loading} 
            style={{
              padding: '14px 20px',
              backgroundColor: '#004481',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 'bold',
              fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              textAlign: 'center',
              width: '100%',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Generando orden...' : 'Pagar con BBVA (Transferencia / CIE)'}
          </button>
        </div>
      </div>
    </div>
  );
}