import { Link, useParams } from 'react-router-dom';

const policies = {
  privacidad: {
    title: 'Aviso de privacidad',
    intro: 'Este aviso explica de forma general qué datos puede tratar CAFRI cuando utilizas la tienda. Debe revisarse y completarse con los datos legales del responsable antes de publicar el sitio.',
    sections: [
      {
        title: 'Datos que puede solicitar la tienda',
        paragraphs: [
          'Para crear una cuenta, procesar pedidos, coordinar entregas y atender solicitudes de facturación, el sitio puede solicitar nombre, correo electrónico, teléfono, domicilio de envío y datos fiscales que proporciones.',
          'Los datos de pago se procesan mediante PayPal. La tienda no debe solicitar ni almacenar tu contraseña de PayPal ni los datos completos de tu tarjeta.'
        ]
      },
      {
        title: 'Finalidades',
        paragraphs: [
          'Los datos se utilizan para administrar la cuenta, confirmar identidad y correo, procesar compras, dar seguimiento a pedidos, coordinar envíos, responder solicitudes de facturación y brindar atención relacionada con la compra.',
          'Antes de añadir analítica, publicidad o comunicaciones promocionales, CAFRI deberá informar esas finalidades y obtener los consentimientos que correspondan.'
        ]
      },
      {
        title: 'Responsable, derechos y contacto',
        paragraphs: [
          'Responsable legal: [COMPLETAR RAZÓN SOCIAL O NOMBRE DEL RESPONSABLE].',
          'Domicilio y contacto para solicitudes de privacidad: [COMPLETAR DOMICILIO Y CORREO DE PRIVACIDAD].',
          'Indica aquí el procedimiento para ejercer derechos de acceso, rectificación, cancelación y oposición, así como el medio para retirar consentimientos cuando corresponda.'
        ]
      },
      {
        title: 'Conservación y transferencias',
        paragraphs: [
          'Completar los plazos de conservación de cuentas, pedidos, facturas y comunicaciones, y describir proveedores que reciban datos (por ejemplo, PayPal, correo electrónico y hosting), sus finalidades y las transferencias aplicables.'
        ]
      }
    ]
  },
  terminos: {
    title: 'Términos y condiciones',
    intro: 'Estas condiciones describen reglas generales de uso de la tienda. Deben completarse y revisarse legalmente antes de aceptarse como contrato de venta.',
    sections: [
      {
        title: 'Identidad y contacto del vendedor',
        paragraphs: [
          'Vendedor: [COMPLETAR RAZÓN SOCIAL O NOMBRE COMERCIAL Y DATOS FISCALES].',
          'Domicilio y atención al cliente: [COMPLETAR DOMICILIO, CORREO Y TELÉFONO].'
        ]
      },
      {
        title: 'Productos, precios y disponibilidad',
        paragraphs: [
          'Los precios y la disponibilidad mostrados corresponden a la información vigente en la tienda y se confirman al procesar el pedido. Las ofertas pueden tener porcentaje y periodo de vigencia visibles en el producto.',
          'Antes de publicar, CAFRI debe especificar impuestos, posibles errores de precio, restricciones de compra y si los precios incluyen o no el envío.'
        ]
      },
      {
        title: 'Pedidos y pagos',
        paragraphs: [
          'El pedido se procesa después de que el pago haya sido confirmado. Los pagos en línea se tramitan mediante PayPal, de acuerdo con sus propias condiciones.',
          'Completar cuándo se considera aceptado un pedido, cómo se notifican cambios o cancelaciones y qué proceso de aclaración está disponible para el comprador.'
        ]
      },
      {
        title: 'Uso del sitio y cambios',
        paragraphs: [
          'El usuario debe proporcionar información correcta y usar la tienda de forma lícita. No se deben prometer garantías, limitaciones de responsabilidad o derechos de cancelación que no hayan sido confirmados por CAFRI y revisados conforme a la normativa aplicable.'
        ]
      }
    ]
  },
  envios: {
    title: 'Envíos, devoluciones y reembolsos',
    intro: 'Los siguientes puntos son una guía para comunicar las reglas comerciales. Los plazos, costos y condiciones concretos deben ser definidos por CAFRI antes de vender.',
    sections: [
      {
        title: 'Envíos',
        paragraphs: [
          'La tienda solicita un domicilio y datos de contacto para coordinar la entrega. El costo puede depender del destino y se muestra durante el proceso de compra cuando esté disponible.',
          'Completar zonas de cobertura, paqueterías, tiempos estimados, costos, tratamiento de retrasos, entregas fallidas y seguimiento de guías.'
        ]
      },
      {
        title: 'Devoluciones y cambios',
        paragraphs: [
          'Completar el plazo para solicitar una devolución o cambio, los requisitos de estado y empaque del producto, las exclusiones aplicables, el procedimiento y quién cubre el envío de retorno.'
        ]
      },
      {
        title: 'Cancelaciones y reembolsos',
        paragraphs: [
          'Completar en qué casos puede cancelarse un pedido, cómo se tramitan los reembolsos, los tiempos estimados y el método de devolución del dinero. PayPal puede aplicar sus propios tiempos de procesamiento.'
        ]
      },
      {
        title: 'Producto dañado o pedido incorrecto',
        paragraphs: [
          'Completar el plazo y el canal para reportar daños, faltantes o productos incorrectos, incluyendo qué información o evidencia debe proporcionar el cliente.'
        ]
      }
    ]
  },
  seguridad: {
    title: 'Seguridad de la información',
    intro: 'CAFRI debe mantener medidas administrativas y técnicas razonables para proteger las cuentas y la información de los clientes. Esta página es informativa y no sustituye el aviso de privacidad.',
    sections: [
      {
        title: 'Buenas prácticas para tu cuenta',
        paragraphs: [
          'Utiliza una contraseña única, no la compartas y cierra sesión en dispositivos compartidos. CAFRI nunca debe solicitarte por correo tu contraseña ni el código de verificación.',
          'Si sospechas que alguien accedió a tu cuenta, cambia tu contraseña y contacta a CAFRI en [COMPLETAR CORREO DE SOPORTE].'
        ]
      },
      {
        title: 'Canal para reportar incidentes',
        paragraphs: [
          'Contacto de seguridad: [COMPLETAR CORREO O CANAL DE REPORTE]. No incluyas contraseñas, códigos de verificación ni datos completos de tarjetas en tu reporte.'
        ]
      }
    ]
  },
  cookies: {
    title: 'Cookies y almacenamiento local',
    intro: 'Las cookies son pequeños datos que un sitio o proveedor puede guardar en el navegador. Esta tienda también usa localStorage, que es almacenamiento del navegador distinto de las cookies.',
    sections: [
      {
        title: 'Uso en esta tienda',
        paragraphs: [
          'La aplicación guarda en localStorage información de sesión y del carrito para conservar el acceso y los productos seleccionados. El código de la tienda no crea cookies propias directamente.',
          'PayPal y otros proveedores externos pueden utilizar cookies o tecnologías similares cuando se cargan sus servicios. Consulta también la información de privacidad de esos proveedores.'
        ]
      },
      {
        title: 'Control desde el navegador',
        paragraphs: [
          'Puedes borrar los datos del sitio desde la configuración del navegador. Al hacerlo, podrías cerrar tu sesión y perder el carrito guardado en ese dispositivo.',
          'Si CAFRI incorpora analítica, publicidad u otras tecnologías no esenciales, deberá actualizar esta información y configurar los avisos o consentimientos que exijan las normas aplicables.'
        ]
      }
    ]
  }
};

const links = [
  ['privacidad', 'Aviso de privacidad'],
  ['terminos', 'Términos y condiciones'],
  ['envios', 'Envíos y devoluciones'],
  ['seguridad', 'Seguridad'],
  ['cookies', 'Cookies']
];

export default function LegalPage() {
  const { page } = useParams();
  const policy = policies[page];

  if (!policy) {
    return (
      <section className="legal-page">
        <h1>Página no encontrada</h1>
        <Link to="/">Volver a la tienda</Link>
      </section>
    );
  }

  return (
    <article className="legal-page">
      <Link to="/" className="legal-back">← Volver a la tienda</Link>
      <p className="legal-eyebrow">CAFRI E-commerce · Información del sitio</p>
      <h1>{policy.title}</h1>
      <p className="legal-intro">{policy.intro}</p>
      <aside className="legal-draft-notice" role="note">
        <strong>Información pendiente de validación:</strong> Los campos entre
        corchetes y las reglas comerciales deben completarse y revisarse antes
        de presentar esta página como política definitiva.
      </aside>
      {policy.sections.map(section => (
        <section className="legal-section" key={section.title}>
          <h2>{section.title}</h2>
          {section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
        </section>
      ))}
      <nav className="legal-related" aria-label="Otras políticas">
        <h2>Más información</h2>
        {links.filter(([slug]) => slug !== page).map(([slug, label]) => (
          <Link key={slug} to={`/legal/${slug}`}>{label}</Link>
        ))}
      </nav>
    </article>
  );
}
