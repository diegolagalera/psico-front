<script setup>
import { RouterLink } from 'vue-router'
import { ArrowLeft, Scale, ShieldCheck, Mail, MapPin } from 'lucide-vue-next'
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
            <Scale class="w-3.5 h-3.5" />
            <span>Información Legal LSSI-CE</span>
          </div>
          <h1 class="font-editorial text-3xl sm:text-4xl font-semibold text-[#2C3E35]">
            Aviso Legal
          </h1>
          <p class="text-xs text-[#2C3E35]/60">
            Última actualización: 31 de octubre de 2026
          </p>
        </header>

        <!-- Datos Identificativos -->
        <div class="p-5 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/10 space-y-2 text-sm">
          <p class="font-semibold text-[#2C3E35]">Datos identificativos de la titular del sitio web:</p>
          <ul class="space-y-1.5 text-[#2C3E35]/80">
            <li><strong>Titular:</strong> Carla Viladot Fonseca</li>
            <li><strong>NIF:</strong> 49255948E</li>
            <li><strong>Colegiada Oficial:</strong> Colegio Oficial de Psicología de Cataluña (Col. 29332)</li>
            <li><strong>Domicilio profesional:</strong> Burgos 7, 2º A, 43870 Amposta (Tarragona), España</li>
            <li><strong>Correo electrónico de contacto:</strong> <a href="mailto:cviladotpsicologa@gmail.com" class="text-[#D9826C] hover:underline font-medium">cviladotpsicologa@gmail.com</a></li>
          </ul>
        </div>

        <div class="prose prose-stone max-w-none text-sm sm:text-base text-[#2C3E35]/85 leading-relaxed space-y-6">
          <p>
            Esta página Web es propiedad de <strong>Carla Viladot Fonseca</strong>, con NIF nº <strong>49255948E</strong> y domicilio en Burgos 7, 2A 43870 Amposta (TARRAGONA). Para cualquier consulta o propuesta, contáctenos en el e-mail <a href="mailto:cviladotpsicologa@gmail.com" class="text-[#D9826C] hover:underline">cviladotpsicologa@gmail.com</a>.
          </p>
          <p>
            Esta página Web se rige por la normativa exclusivamente aplicable en España, quedando sometida a ella, tanto nacionales como extranjeros que utilicen esta Web.
          </p>
          <p>
            El acceso a nuestra página Web por parte de la PERSONA USUARIA es gratuito y su uso se rige por las condiciones de uso vigentes en el momento del acceso, que rogamos lea detenidamente. Si la PERSONA USUARIA no estuviere de acuerdo con las presentes condiciones de uso, deberá abstenerse de utilizar este portal y operar por medio del mismo, pudiendo contactar con nosotros para que le resolvamos cualquier duda en relación a las mismas.
          </p>
          <p>
            El suministro de datos personales y la compra de productos a través de nuestro portal requiere una edad mínima de 18 años, o en su caso, disponer de capacidad jurídica suficiente para contratar.
          </p>
          <p>
            En cualquier momento podremos modificar la presentación y configuración de nuestra Web, ampliar o reducir servicios, e incluso suprimirla de la Red, así como los servicios y contenidos prestados.
          </p>

          <h2 class="font-editorial text-2xl font-semibold text-[#2C3E35] pt-4">
            A. Propiedad Intelectual
          </h2>
          <p>
            Todos los contenidos, textos, imágenes, y códigos fuente son propiedad de Carla Viladot Fonseca o de terceros a los que se han adquirido sus derechos de explotación, y están protegidos por los derechos de Propiedad Intelectual e Industrial.
          </p>
          <p>
            La PERSONA USUARIA únicamente tiene derecho a un uso privado de los mismos, sin ánimo de lucro, y necesita autorización expresa para modificarlos, reproducirlos, explotarlos, distribuirlos o ejercer cualquier derecho perteneciente a su titular.
          </p>
          <p>
            Carla Viladot Psicología es una marca registrada, y está prohibida su reproducción, imitación, utilización o inserción de estas marcas sin nuestra debida autorización.
          </p>
          <p>
            El establecimiento de enlaces a nuestro portal no confiere ningún derecho sobre el mismo. Asimismo, el simple hecho de establecer un enlace a nuestra página web no da derecho a otorgarse la categoría de colaborador o socio.
          </p>
          <p>
            Carla Viladot Fonseca queda exonerado de responsabilidad por cualquier reclamación respecto a los derechos de propiedad intelectual de los artículos e imágenes publicadas por terceros en su portal.
          </p>
          <p>
            Está absolutamente prohibida la imitación ya sea total o parcial de nuestro portal o el establecimiento de enlaces a nuestra página web sin la autorización previa de Carla Viladot Fonseca.
          </p>

          <h2 class="font-editorial text-2xl font-semibold text-[#2C3E35] pt-4">
            B. Condiciones de Acceso y Uso
          </h2>
          <p>
            El acceso a nuestra página Web es gratuito y no exige suscripción o registro previo. Sin embargo, determinados servicios son de acceso restringido a determinadas PERSONAS USUARIAS y requieren haber realizado un proceso de registro y/o la identificación mediante contraseñas. Estos servicios quedarán debidamente identificados en la Web.
          </p>
          <p>
            El envío de datos personales implica la aceptación expresa por parte de la PERSONA USUARIA de nuestra política de privacidad.
          </p>
          <p>
            La PERSONA USUARIA debe acceder a nuestra página Web conforme a la buena fe, las normas de orden público y a las presentes Condiciones Generales de uso. El acceso a nuestro sitio Web se realiza bajo la propia y exclusiva responsabilidad de la PERSONA USUARIA, que responderá en todo caso de los daños y perjuicios que pueda causar a terceros o a nosotros mismos.
          </p>
          <p>
            La PERSONA USUARIA tiene expresamente prohibida la utilización y obtención de los servicios, productos y contenidos ofrecidos en la presente página web, por procedimientos distintos a los estipulados en las presentes condiciones de uso y, en su caso, en las condiciones particulares que regulen la adquisición de determinados productos.
          </p>
          <p>
            La PERSONA USUARIA tiene prohibido cualquier tipo de acción sobre nuestro portal que origine una excesiva sobrecarga de funcionamiento a nuestros sistemas informáticos, así como la introducción de virus, o instalación de robots, o software que altere el normal funcionamiento de nuestra web, o en definitiva pueda causar daños a nuestros sistemas informáticos.
          </p>
          <p>
            Teniendo en cuenta la dificultad de control respecto a la información, contenidos y servicios que contengan páginas web de terceros disponibles desde nuestra página web, le comunicamos que Carla Viladot Fonseca, no se hace responsable de los mismos, sin perjuicio de que intentará, en la medida de lo posible, velar por su legalidad.
          </p>
          <p>
            Carla Viladot Fonseca se reserva el derecho a dar de baja a cualquier PERSONA USUARIA que la organización entienda que ha vulnerado las condiciones que rigen el uso de nuestra página web. Asimismo, se reserva el derecho de ejercitar las acciones legales oportunas contra aquellos que vulneren las presentes condiciones generales de uso.
          </p>

          <h2 class="font-editorial text-2xl font-semibold text-[#2C3E35] pt-4">
            C. Política de Privacidad
          </h2>
          <p>
            La confidencialidad y la seguridad son valores primordiales de Carla Viladot Fonseca y, en consecuencia, asumimos el compromiso de garantizar la privacidad de la PERSONA USUARIA en todo momento y de no recabar información innecesaria. El suministro de datos personales a través de nuestro portal requiere una edad mínima de 18 años y la aceptación expresa de nuestra Política de Privacidad.
          </p>

          <h2 class="font-editorial text-2xl font-semibold text-[#2C3E35] pt-4">
            D. Responsabilidades
          </h2>
          <p>
            Al poner a disposición de la PERSONA USUARIA esta página Web queremos ofrecerle un servicio de calidad, utilizando la máxima diligencia en la prestación del mismo, así como en los medios tecnológicos utilizados. No obstante, Carla Viladot Fonseca no garantiza que la disponibilidad del servicio sea continua e ininterrumpida, por circunstancias originadas por problemas en la red de Internet, averías en los dispositivos informáticos u otras circunstancias imprevisibles, de manera que la PERSONA USUARIA acepta soportar dentro de unos límites razonables estas circunstancias.
          </p>
          <p>
            Esta página web, salvo lo regulado, en su caso, por algunas condiciones de uso específicas, es puramente informativa y de presentación corporativa de nuestros productos y servicios, por lo que Carla Viladot Fonseca no se responsabiliza por las expectativas de cualquier tipo que pueda generar a la PERSONA USUARIA.
          </p>
          <p>
            Todo lo referente a nuestra página web, se rige exclusivamente por las leyes españolas. En el caso de que se produzca cualquier tipo de discrepancia o diferencia entre las partes en relación con la interpretación y contenido de la presente página web, todas las partes se someten a los Juzgados y Tribunales que legalmente correspondan.
          </p>

          <h2 class="font-editorial text-2xl font-semibold text-[#2C3E35] pt-4">
            E. Vigencia de las Condiciones Generales de Acceso a la Web
          </h2>
          <p>
            Las presentes Condiciones Generales de Uso han sido modificadas con fecha 31/10/2026. En cualquier momento podemos proceder a su modificación: por favor, compruebe la fecha de emisión en cada ocasión en que se conecte a nuestra página Web y así tendrá la certeza de que no se ha producido modificación alguna que le afecte.
          </p>
          <p class="text-xs text-[#2C3E35]/65 pt-4 border-t border-[#2C3E35]/10">
            Para cualquier cuestión respecto a las Condiciones de Uso de nuestra página web, puede ponerse en contacto con nosotros en los datos arriba indicados, o con Lant Abogados en info@lant-abogados.com o en https://www.lant-abogados.com/.
          </p>
        </div>
      </article>
    </main>
  </div>
</template>
