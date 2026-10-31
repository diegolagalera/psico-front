<script setup>
import { RouterLink } from 'vue-router'
import { ArrowLeft, ShieldCheck, Lock, Mail, MapPin } from 'lucide-vue-next'
</script>

<template>
  <div class="min-h-screen bg-[#FAF8F5] text-[#2C3E35]">
    <!-- Cabecera simple -->
    <header class="border-b border-[#2C3E35]/10 bg-white/80 backdrop-blur-sm sticky top-0 z-20">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 text-xs font-semibold text-[#4A6B5D] hover:text-[#2C3E35] transition-colors"
        >
          <ArrowLeft class="w-4 h-4" />
          <span>Volver al inicio</span>
        </RouterLink>
        <span class="font-editorial text-lg font-semibold text-[#2C3E35]">Vuelve a Ti</span>
      </div>
    </header>

    <!-- Contenido Legal -->
    <main class="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <article class="bg-white rounded-3xl border border-[#2C3E35]/10 p-6 sm:p-12 shadow-xs space-y-8">
        <header class="space-y-3 border-b border-[#2C3E35]/10 pb-6">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4A6B5D]/10 text-[#4A6B5D] text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck class="w-3.5 h-3.5" />
            <span>Protección de Datos · RGPD & LOPDGDD</span>
          </div>
          <h1 class="font-editorial text-3xl sm:text-4xl font-semibold text-[#2C3E35]">
            Política de Privacidad
          </h1>
          <p class="text-xs text-[#2C3E35]/60">
            Última actualización: 31 de octubre de 2026
          </p>
        </header>

        <div class="prose prose-stone max-w-none text-sm sm:text-base text-[#2C3E35]/85 leading-relaxed space-y-6">
          <p>
            La confidencialidad y la seguridad son valores primordiales de <strong>Carla Viladot Fonseca</strong> y, en consecuencia, asumimos el compromiso de garantizar la privacidad del Usuario en todo momento y de no recabar información innecesaria. A continuación, le proporcionamos toda la información necesaria sobre nuestra Política de Privacidad en relación con los datos personales que recabamos, explicándole:
          </p>
          <ul class="list-disc pl-5 space-y-1">
            <li>Quién es el responsable del tratamiento de sus datos.</li>
            <li>Para qué finalidades recabamos los datos que le solicitamos.</li>
            <li>Cuál es la legitimación para su tratamiento.</li>
            <li>Durante cuánto tiempo los conservamos.</li>
            <li>A qué destinatarios se comunican sus datos.</li>
            <li>Cuáles son sus derechos y cómo ejercerlos.</li>
          </ul>

          <!-- Responsable -->
          <h2 class="font-editorial text-2xl font-semibold text-[#2C3E35] pt-4">
            1. Responsable del Tratamiento
          </h2>
          <div class="p-5 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/10 space-y-1.5 text-sm">
            <p><strong>Identidad:</strong> Carla Viladot Fonseca</p>
            <p><strong>NIF:</strong> 49255948E</p>
            <p><strong>Colegiación:</strong> Psicóloga General Sanitaria · Col. 29332 (COP Cataluña)</p>
            <p><strong>Dirección postal:</strong> Burgos 7, 2A, 43870 Amposta (TARRAGONA)</p>
            <p><strong>Correo electrónico:</strong> <a href="mailto:cviladotpsicologa@gmail.com" class="text-[#D9826C] hover:underline font-medium">cviladotpsicologa@gmail.com</a></p>
          </div>

          <!-- Finalidades -->
          <h2 class="font-editorial text-2xl font-semibold text-[#2C3E35] pt-4">
            2. Finalidades, Legitimación y Conservación
          </h2>
          <p>De los tratamientos de los datos enviados a través de:</p>

          <div class="space-y-4">
            <div class="p-5 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/10 space-y-2">
              <h3 class="font-editorial text-lg font-semibold text-[#2C3E35]">
                Formulario de Contacto y Solicitud de Valoración
              </h3>
              <p><strong>Finalidad:</strong> Facilitarle un medio para que pueda ponerse en contacto con nosotros y contestar a sus solicitudes de información, evaluar su situación vital previa para el acceso al programa clínico, así como enviarle comunicaciones de nuestros productos, servicios y actividades, inclusive por medios electrónicos (correo electrónico, SMS, etc.), si marca la casilla de aceptación.</p>
              <p><strong>Legitimación:</strong> El consentimiento del usuario al solicitarnos información a través de nuestro formulario de contacto y al marcar la casilla de aceptación de envío de información.</p>
              <p><strong>Conservación:</strong> Una vez resuelta su solicitud por medio de nuestro formulario o contestada por correo electrónico, si no ha generado un nuevo tratamiento, y en caso de haber aceptado recibir envíos comerciales, hasta que solicite la baja de los mismos.</p>
            </div>

            <div class="p-5 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/10 space-y-2">
              <h3 class="font-editorial text-lg font-semibold text-[#2C3E35]">
                Envío de correos electrónicos
              </h3>
              <p><strong>Finalidad:</strong> Contestar a sus solicitudes de información, atender sus peticiones y responder sus consultas o dudas. En caso de recibir su Currículum Vitae, sus datos personales y curriculares podrán formar parte de nuestras bases de datos para participar en nuestros procesos de selección presentes y futuros.</p>
              <p><strong>Legitimación:</strong> El consentimiento del usuario al solicitarnos información a través de la dirección de correo electrónico o enviarnos sus datos y CV para participar en nuestros procesos de selección.</p>
              <p><strong>Conservación:</strong> Una vez resulta contestada su petición por correo electrónico, si no ha generado un nuevo tratamiento. En el caso de recibir su CV, sus datos podrán ser conservados durante un año máximo para futuros procesos de selección.</p>
            </div>
          </div>

          <!-- Obligación -->
          <h3 class="font-editorial text-xl font-semibold text-[#2C3E35] pt-2">
            Obligación de facilitarnos sus datos personales y consecuencias de no hacerlo
          </h3>
          <p>
            El suministro de datos personales requiere una edad mínima de 14 años o, en su caso, la edad mínima que establezca la normativa de protección de datos aplicable y/o disponer de capacidad jurídica suficiente para contratar.
          </p>
          <p>
            Los datos personales solicitados son necesarios para gestionar sus solicitudes, darle de alta como usuario y/o prestarle los servicios que pueda contratar, por lo que, si no nos los facilita, no podremos atenderle correctamente ni prestarle el servicio que ha solicitado.
          </p>
          <p>
            En todo caso, nos reservamos el derecho de decidir sobre la incorporación o no de sus datos personales y demás información a nuestras bases de datos.
          </p>

          <!-- Destinatarios -->
          <h2 class="font-editorial text-2xl font-semibold text-[#2C3E35] pt-4">
            3. Destinatarios de sus Datos
          </h2>
          <p>
            Sus datos son confidenciales y no se cederán a terceros, salvo que exista obligación legal o para la estricta prestación técnica de los servicios (proveedores de infraestructura tecnológica bajo contratos de encargo de tratamiento conformes con el RGPD y bajo secreto profesional sanitario).
          </p>

          <!-- Cookies -->
          <h2 class="font-editorial text-2xl font-semibold text-[#2C3E35] pt-4">
            4. Cookies
          </h2>
          <p>
            Esta página web utiliza cookies técnicas, de personalización, de análisis y publicitarias, propias y de terceros que tratan datos de conexión y/o del dispositivo, así como hábitos de navegación para fines estadísticos y publicitarios. Por ello, al acceder a nuestra web, en cumplimiento del artículo 22 de la Ley de Servicios de la Sociedad de la Información, al tratar las cookies mencionadas, le hemos solicitado su consentimiento para su uso y facilitado información de las mismas en nuestra <RouterLink to="/cookies" class="text-[#D9826C] font-semibold hover:underline">Política de Cookies</RouterLink>.
          </p>

          <!-- Derechos -->
          <h2 class="font-editorial text-2xl font-semibold text-[#2C3E35] pt-4">
            5. Derechos en Relación con sus Datos Personales
          </h2>
          <p>
            Cualquier persona puede retirar su consentimiento en cualquier momento, cuando el mismo se haya otorgado para el tratamiento de sus datos. En ningún caso, la retirada de este consentimiento condiciona la ejecución del contrato de suscripción o las relaciones generadas con anterioridad.
          </p>
          <p>Igualmente, puede ejercer los siguientes derechos:</p>
          <ul class="list-disc pl-5 space-y-1">
            <li>Solicitar el acceso a sus datos personales o su rectificación cuando sean inexactos.</li>
            <li>Solicitar su supresión cuando, entre otros motivos, los datos ya no sean necesarios para los fines para los que fueron recogidos.</li>
            <li>Solicitar la limitación de su tratamiento en determinadas circunstancias.</li>
            <li>Solicitar la oposición al tratamiento de sus datos por motivos relacionados con su situación particular.</li>
            <li>Solicitar la portabilidad de los datos en los casos previstos en la normativa.</li>
            <li>Otros derechos reconocidos en las normativas aplicables.</li>
          </ul>
          <p>
            <strong>Dónde y cómo solicitar sus Derechos:</strong> Mediante un escrito dirigido al responsable a su dirección postal o electrónica (<a href="mailto:cviladotpsicologa@gmail.com" class="text-[#D9826C] hover:underline">cviladotpsicologa@gmail.com</a>), indicando la referencia “Datos Personales”, especificando el derecho que se quiere ejercer y respecto a qué datos personales.
          </p>
          <p>
            En caso de divergencias con la empresa en relación con el tratamiento de sus datos, puede presentar una reclamación ante la Agencia Española de Protección de Datos (<a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" class="text-[#D9826C] hover:underline">www.aepd.es</a>).
          </p>

          <!-- Seguridad -->
          <h2 class="font-editorial text-2xl font-semibold text-[#2C3E35] pt-4">
            6. Seguridad de sus Datos Personales
          </h2>
          <p>
            Con el objetivo de salvaguardar la seguridad de sus datos personales, le informamos que hemos adoptado todas las medidas de índole técnica y organizativa necesarias para garantizar la seguridad de los datos personales suministrados de su alteración, pérdida y tratamientos o accesos no autorizados.
          </p>

          <!-- Actualización -->
          <h2 class="font-editorial text-2xl font-semibold text-[#2C3E35] pt-4">
            7. Actualización de sus Datos
          </h2>
          <p>
            Es importante que para que podamos mantener sus datos personales actualizados, nos informe siempre que haya habido alguna modificación en ellos, en caso contrario, no respondemos de la veracidad de los mismos. No nos hacemos responsables de la política de privacidad respecto a los datos personales que pueda facilitar a terceros por medio de los enlaces disponibles en nuestra página web.
          </p>
          <p class="text-xs text-[#2C3E35]/65 pt-4 border-t border-[#2C3E35]/10">
            La presente Política de Privacidad ha sido actualizada en fecha 31/10/2026 y puede ser modificada para adaptarla a los cambios que se produzcan en nuestra web, así como modificaciones legislativas o jurisprudenciales sobre datos personales que vayan apareciendo, por lo que exige su lectura, cada vez que nos facilite sus datos a través de esta Web.
          </p>
        </div>
      </article>
    </main>
  </div>
</template>
