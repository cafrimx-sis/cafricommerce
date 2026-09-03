import React from 'react';

export default function PaymentView({ formData, total, loading, onBack, onPay }) {
  return (
    <div style={styles.container}>
      <div style={styles.headerBox}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <h2 style={{color: '#004481', margin: '0 0 5px 0', fontSize: '1.5rem'}}>2. Resumen y Pago BBVA</h2>
          <button onClick={onBack} style={styles.linkButton}>← Cambiar dirección</button>
        </div>
        <p style={{color: '#64748b', margin: 0, fontSize: '0.95rem'}}>Verifica los datos de destino y genera tu orden de pago.</p>
      </div>

      <div style={styles.addressSummaryCard}>
        <h4 style={{margin: '0 0 8px 0', color: '#1e293b'}}>📍 Destino de Envío:</h4>
        <p style={{margin: '2px 0', color: '#475569'}}>{formData.calle} #{formData.numeroExterior} {formData.numeroInterior ? `Int. ${formData.numeroInterior}` : ''}, Col. {formData.colonia}</p>
        <p style={{margin: '2px 0', color: '#475569'}}>{formData.ciudad}, {formData.estado} C.P. {formData.codigoPostal}</p>
        <p style={{margin: '2px 0', color: '#475569'}}>Tel: {formData.telefonoContacto}</p>
      </div>

      <div style={styles.summaryBox}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
          <span style={{color: '#475569', fontSize: '1rem'}}>Total a Pagar (IVA y Flete incluidos):</span>
          <span style={{color: '#0f172a', fontSize: '1.4rem', fontWeight: 'bold'}}>${total.toLocaleString()} MXN</span>
        </div>

        <button 
          onClick={onPay}
          disabled={loading} 
          style={{
            ...styles.primaryButton, 
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Generando orden...' : 'Pagar con BBVA (Transferencia / CIE)'}
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '650px', margin: '40px auto', background: '#ffffff', padding: '35px', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)', border: '1px solid #e2e8f0' },
  headerBox: { marginBottom: '25px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px' },
  addressSummaryCard: { background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px' },
  summaryBox: { marginTop: '20px', paddingTop: '20px', borderTop: '2px solid #f1f5f9', display: 'flex', flexDirection: 'column' },
  primaryButton: { padding: '14px 20px', backgroundColor: '#004481', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', textAlign: 'center', width: '100%' },
  linkButton: { background: 'none', border: 'none', color: '#004481', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' }
};