# validador-cfdi
validador de CFDI con escucha email.

## Pre Requisitos	&nbsp;
**INTERPRETE DE JAVASCRIPT [NODE](http://nodejs.org) v0.10.38 o superior**

**FOREVER**

# 1. Instalar forever
$ npm install forever


## Instalación	&nbsp;
**Una vez instalado [node](http://nodejs.org):**

# 1. Instalar dependencias
$ npm install

# 2. Instalar extensiones
$ mv ext/index.js node_modules/mail-listener2/index.js

# 3. Entrar a la carpeta bin
$ cd bin

# 4. Correr el programa que escucha el correo
$ forever start -a --uid mailListener mailListener.js

# 5. Correr el programa que se conecta al sat
$ forever start -a --uid satClient satClient.js

# 6. Correr el programa que se conecta a mfiles
$ forever start -a --uid mfiles-connector mfiles-connector.js

# 6. Verificar que los programas se estén ejecutando
$ forever list
$ forever logs mailListener
$ forever logs satClient
$ forever logs mfiles-connector


