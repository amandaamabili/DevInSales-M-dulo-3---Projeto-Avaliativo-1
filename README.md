# DEVinSales API

- [Tecnologias](#tech)
- [Como Utilizar](#settings)

<a id="tech"></a>

Este projeto foi refatorado  para avaliar os conhecimentos adquiridos em devOps

## Tecnologias

O projeto desenvolvido utiliza as seguintes tecnologias:
- [Docker](https://www.docker.com/) 
- [Docker-compose](https://docs.docker.com/compose/compose-file/compose-file-v3/) 
- [Sentry](https://sentry.io/organizations/devinhouse/projects/sales/?project=6369069) 
- [NgInx](https://hub.docker.com/_/nginx) 
- [Winston](https://www.npmjs.com/package/winston) 
- [Morgan](https://www.npmjs.com/package/morgan) 
- [NodeJS](https://nodejs.org/en/) 
- [Express](https://expressjs.com/)
- [Bcrypt](https://github.com/kelektiv/node.bcrypt.js/)
- [Sequelize](https://sequelize.org/)
- [Postgres](https://www.postgresql.org/)
- [Swagger](https://swagger.io/)

## Deploy

- [AWS](https://aws.amazon.com/pt/free/?all-free-tier.sort-by=item.additionalFields.SortRank&all-free-tier.sort-order=asc&awsf.Free%20Tier%20Categories=categories%23compute&trk=a5a8f3c9-c18a-485c-bbdb-52b795178fbe&sc_channel=acquisition&sc_medium=ACQ-P|PS-GO|Brand|Desktop|SU|Compute|EC2|BR|EN|Text&s_kwcid=AL!4422!3!490415521584!e!!g!!aws%20ec2&ef_id=Cj0KCQjwma6TBhDIARIsAOKuANxesoJMRf_8utfWrGNTqPKwy_NRxLrRKB1ty1k5lHavX8_j6-xvyKcaAqexEALw_wcB:G:s&s_kwcid=AL!4422!3!490415521584!e!!g!!aws%20ec2&awsf.Free%20Tier%20Types=*all) 
- [Heroku](https://senai-dev-in-sales.herokuapp.com/api/v1/docs/)
- 


<a id="settings"></a>

# Como Utilizar

### **Pré-requisitos**

  - Possuir o NodeJS e o Postgres instalado na sua máquina.

```bash
# Clone o Repositório
$ git clone https://github.com/DEVin-Teltec-BRy/M2P2-DEVinSales.git
```

```bash
# Entre na pasta projeto
$ cd M2P2-DEVinSales
```

```bash
# Já dentro da pasta do projeto.
# Instale as bibliotecas utlizadas no projeto.
$ yarn ou npm install
```

```bash
# Criar um arquivo .env a partir do arquivo .env.sample
$ DATABASE_URL=postgresql://user:password@host:port/database
$ SECRET=senha secreta
```

```bash
# Criar o Database utilizando o Sequelize
$ yarn sequelize db:create 
# ou
$ npx sequelize-cli db:create
```

```bash
# Para criar as tabelas no postgres
$ yarn migrate:up
# ou
$ npm run migrate:up
```

```bash
# Para deletar as tabelas no postgres
$ yarn migrate:down
# ou
$ npm run migrate:down
```

```bash
# Para popular os dados nas tabelas do postgres com as seeders
$ yarn seeders:up
# ou
$ npm run seeders:up
```

```bash
# Para deletas os dados das tabelas do postgres
$ yarn seeders:down
# ou
$ npm run seeders:down
```

```bash
# Executar o programa.
$ yarn dev
# ou
$ npm run dev
```
```bash
# Executar o programa.
$ yarn swagger-autogen
# ou
$ npm run swagger-autogen
```
