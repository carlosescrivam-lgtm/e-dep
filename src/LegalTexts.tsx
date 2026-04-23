import LegalPage from "./LegalPage";

export function AvisoLegalPage() {
  return (
    <LegalPage title="Aviso legal">
      <p>
        En cumplimiento con el deber de información recogido en la Ley 34/2002,
        de Servicios de la Sociedad de la Información y del Comercio
        Electrónico (LSSI-CE), se informa de los siguientes datos:
      </p>

      <p>
        <strong>Titular:</strong> Carlos Escrivá Masip
        <br />
        <strong>NIF:</strong> 20820547G
        <br />
        <strong>Domicilio:</strong> C/ Cronista Carreres 5 - 46003 - Valencia -
        España
        <br />
        <strong>Email de contacto:</strong> contacto@e-dep.org
      </p>

      <p>
        El presente sitio web, accesible en www.e-dep.org, tiene como finalidad
        ofrecer un servicio de creación y gestión de páginas de condolencias
        digitales.
      </p>

      <p>
        El acceso y uso del sitio web atribuye la condición de usuario, e
        implica la aceptación plena y sin reservas de todas las disposiciones
        incluidas en este Aviso Legal.
      </p>

      <p>
        El titular se reserva el derecho a modificar cualquier tipo de
        información que pudiera aparecer en el sitio web, sin que exista
        obligación de preavisar a los usuarios.
      </p>

      <p>
        No se garantiza la inexistencia de interrupciones o errores en el acceso
        al sitio web, aunque se desarrollarán los esfuerzos necesarios para
        evitarlos.
      </p>
    </LegalPage>
  );
}

export function PrivacidadPage() {
  return (
    <LegalPage title="Política de privacidad">
      <p>
        <strong>Responsable del tratamiento</strong>
        <br />
        Carlos Escrivá Masip
        <br />
        NIF: 20820547G
        <br />
        Email: contacto@e-dep.org
      </p>

      <p>
        <strong>Datos que recopilamos</strong>
      </p>
      <ul>
        <li>Datos de funerarias registradas</li>
        <li>Datos de usuarios particulares que crean páginas</li>
        <li>Datos introducidos en páginas de condolencias</li>
        <li>Imágenes y mensajes publicados por usuarios</li>
        <li>Datos técnicos necesarios para el funcionamiento del sitio</li>
      </ul>

      <p>
        <strong>Finalidad</strong>
      </p>
      <ul>
        <li>Gestionar el servicio de páginas de condolencias</li>
        <li>Permitir la publicación de mensajes</li>
        <li>Gestionar cuentas de usuario</li>
        <li>Cumplir obligaciones legales</li>
      </ul>

      <p>
        <strong>Base legal</strong>
      </p>
      <ul>
        <li>Ejecución de un contrato</li>
        <li>Consentimiento del usuario</li>
        <li>Interés legítimo</li>
      </ul>

      <p>
        <strong>Conservación</strong>
      </p>
      <p>
        Los datos se conservarán mientras exista relación con el servicio o
        durante el tiempo necesario para cumplir obligaciones legales.
      </p>

      <p>
        <strong>Cesión de datos</strong>
      </p>
      <p>
        No se cederán datos a terceros salvo obligación legal o proveedores
        necesarios para el funcionamiento del servicio.
      </p>

      <p>
        <strong>Derechos</strong>
      </p>
      <p>
        Puedes ejercer tus derechos de acceso, rectificación, supresión,
        oposición y limitación enviando un email a contacto@e-dep.org.
      </p>

      <p>
        <strong>Seguridad</strong>
      </p>
      <p>
        Se han adoptado medidas técnicas y organizativas adecuadas para
        garantizar la seguridad de los datos.
      </p>
    </LegalPage>
  );
}

export function CookiesPage() {
  return (
    <LegalPage title="Política de cookies">
      <p>
        Este sitio web utiliza cookies propias con fines exclusivamente
        técnicos.
      </p>

      <p>
        Las cookies técnicas son necesarias para el correcto funcionamiento del
        sitio web y no requieren consentimiento.
      </p>

      <p>
        Actualmente, E-Dep no utiliza cookies de análisis ni publicidad.
      </p>

      <p>
        En caso de incorporarlas en el futuro, se informará adecuadamente y se
        solicitará el consentimiento correspondiente.
      </p>

      <p>
        Puedes configurar tu navegador para bloquear o eliminar cookies.
      </p>
    </LegalPage>
  );
}

export function CondicionesPage() {
  return (
    <LegalPage title="Términos y condiciones">
      <p>
        <strong>Objeto</strong>
      </p>
      <p>
        E-Dep es una plataforma que permite la creación de páginas de
        condolencias digitales gestionadas por funerarias o particulares.
      </p>

      <p>
        <strong>Uso del servicio</strong>
      </p>
      <ul>
        <li>Utilizar el servicio de forma lícita</li>
        <li>No publicar contenido ofensivo, ilegal o inapropiado</li>
        <li>No suplantar identidades</li>
      </ul>

      <p>
        <strong>Contenido</strong>
      </p>
      <p>
        El usuario es responsable del contenido que publica. E-Dep se reserva el
        derecho a eliminar contenidos que sean ofensivos, vulneren derechos de
        terceros o incumplan la normativa vigente.
      </p>

      <p>
        <strong>Funcionamiento del servicio</strong>
      </p>
      <ul>
        <li>Las páginas pueden tener duración limitada</li>
        <li>El servicio puede incluir versiones de pago</li>
        <li>Algunas funciones pueden variar según el plan contratado</li>
      </ul>

      <p>
        <strong>Responsabilidad</strong>
      </p>
      <p>
        E-Dep no se responsabiliza del uso indebido por parte de los usuarios ni
        del contenido publicado por terceros.
      </p>

      <p>
        <strong>Modificaciones</strong>
      </p>
      <p>
        El titular se reserva el derecho a modificar estos términos en cualquier
        momento.
      </p>
    </LegalPage>
  );
}

export function ContactoPage() {
  return (
    <LegalPage title="Contacto">
      <p>
        Para cualquier consulta, puedes ponerte en contacto a través de:
      </p>

      <p>
        <strong>Email:</strong> contacto@e-dep.org
      </p>

      <p>Este canal está disponible para:</p>
      <ul>
        <li>Soporte técnico</li>
        <li>Consultas comerciales</li>
        <li>Ejercicio de derechos relacionados con protección de datos</li>
      </ul>
    </LegalPage>
  );
}