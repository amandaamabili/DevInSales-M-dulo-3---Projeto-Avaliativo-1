const User = require("../models/User");
const { sign } = require("jsonwebtoken");
const { Op } = require("sequelize");
const bcrypt = require("bcrypt");
const Role = require("../models/Role");
const {
  validateErrors,
  stringToDate,
  verifyAge,
  verifyDate,
} = require("../utils/functions");
const { READ, WRITE } = require("../utils/constants/permissions");

module.exports = {
  async create(req, res) {
    /*
      #swagger.tags = ['Usuário']
      #swagger.description = 'Endpoint que criar um novo usuário.'
      #swagger.parameters['obj'] = {
        in: 'body',
        required: true,
        schema: {
          $ref: '#/definitions/AddUser'
        }
      }
      #swagger.responses[201] = {
        description: 'Created',
        schema: {
          message: 'Usuário salvo com sucesso.'
        }
      }
      #swagger.responses[403] = {
        description: 'Forbidden'
      }
    */
    try {
      const { name, password, email, birth_date, roles } = req.body;

      const dateValidation = verifyDate(birth_date);
      if (!dateValidation) {
        throw new Error("É necessário que a data informada exista e  seja do tipo dd/mm/yyyy")
      }

      const ageValidation = verifyAge(stringToDate(birth_date));

      if (!ageValidation) {
        throw new Error("É necessário que o usuário seja maior de idade")
      }

      if (!roles || roles.length === 0) {
        throw new Error("O novo usuário necessita ter um cargo de WRITE e READ")
      }

      const responseRoles = await Role.findAll({
        where: {
          id: roles.map((role) => role.role_id),
        },
        include: {
          association: "permissions",
          through: { attributes: [] },
          attributes: ["description"],
        },
      });
      if (responseRoles.length === 0) {
        throw new Error("O novo usuário necessita ter um cargo de WRITE e READ")
      }

      const response = responseRoles.filter((role) => {
        const permissions = role.permissions.filter((permission) => {
          return (
            permission.description === READ || permission.description === WRITE
          );
        });
        return permissions.length >= 2;
      });

      if (response.length === 0) {
        throw new Error("O novo usuário necessita ter um cargo de WRITE e READ")
      }

      const user = await User.create({
        name,
        password,
        email,
        birth_date: stringToDate(birth_date),
      });

      await user.setRoles(responseRoles);

      return res.status(201).send({ response: user.id });
    } catch (error) {
      const message = validateErrors(error);
      return res.status(400).send(message);
    }
  },

  async session(req, res) {
    /*
      #swagger.tags = ['Usuário']
      #swagger.description = 'Endpoint para login do usuário, quando email e senha são validos retorna um token.'
      #swagger.parameters['obj'] = {
        in: 'body',
        required: true,
        schema: {
          $ref: '#/definitions/UserLogin'
        }
      }
      #swagger.responses[201] = {
        description: 'Token de acesso',
        schema: {
          "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQsInJvbGVzIjpbeyJpZCI6Miwi___RANDOM_TOKEN___JPV05FUiJ9XSwiaWF0IjoxNjQ2ODA0MDkxLCJleHAiOjE2NDY4OTA0OTF9.OwvUy0p3BVfbicuCg9YYAk5tlPQ6UKB_bZrHt8-H_CU"
        }
      }
      #swagger.responses[400] = {
        description: 'Login não efetuado',
        schema: {
          "message": "Email ou senha inválidos"
        }
      }
    */
    try {
      const { email, password } = req.body;

      const user = await User.findOne({
        attributes: ["id", "email", "password"],
        where: {
          email: {
            [Op.eq]: email,
          },
        },
        include: [
          {
            association: "roles",
            attributes: ["id", "description"],
            through: {
              attributes: [],
            },
          },
        ],
      });
      const existPassword = user ? user.password : "";
      const match = await bcrypt.compareSync(password, existPassword);

      if (!match) {
        const message = validateErrors({
          message: "Email ou senha inválidos",
        });
        return res.status(400).send(message);
      }
      const token = sign(
        { userId: user.id, roles: user.roles },
        process.env.SECRET,
        {
          expiresIn: "99d",
        }
      );

      return res.status(201).send({ token: token });
    } catch (error) {
      const message = validateErrors(error);
      return res.status(400).send(message);
    }
  },

  async index(req, res) {
    /*
      #swagger.tags = ['Usuário']
      #swagger.description = 'Endpoint para buscar todos os usuários do banco de dados.'
      #swagger.parameters['name'] = {
        in: 'query',
        type: 'string',
        description: 'Nome de um usuário.',
        default: 'John Doe'
      }
      #swagger.parameters['birth_date_min'] = {
        in: 'query',
        type: 'string',
        description: 'Data limite inferior da consulta.',
        default: 'DD/MM/AAAA'
      }
      #swagger.parameters['birth_date_max'] = {
        in: 'query',
        type: 'string',
        description: 'Data limite superior da consulta.',
        default: 'DD/MM/AAAA'
      }
    */
    try {
      const { name, birth_date_min, birth_date_max } = req.query;

      const query = {};
      if (name) {
        query.name = { [Op.iLike]: `%${name}%` };
      }
      if (birth_date_min) {
        const dateMin = stringToDate(birth_date_min);
        query.birth_date = {
          [Op.gt]: dateMin,
        };
      }
      if (birth_date_max) {
        const dateMax = stringToDate(birth_date_max);
        query.birth_date = { ...query?.birth_date, [Op.lt]: dateMax };
      }

      const users = await User.findAll({
        attributes: ["id", "name", "email", "birth_date"],
        where: query,
      });

      if (users.length === 0) {
        return res.status(204).send();
      }
      /*
        #swagger.responses[200] = {
        schema: {
          $ref: '#/definitions/UserInfo'
        }
      }
      */
      return res.status(200).send({ users });
    } catch (error) {
      const message = validateErrors(error);
      return res.status(400).send(message);
    }
  },
  async delete(req, res) {
    // #swagger.tags = ['Usuário']
    // #swagger.description = 'Endpoint para deletar um usuário.'
    /*
      #swagger.parameters['user_id'] = {
        in: 'path',
        type: 'integer',
        required: true
      }
      #swagger.responses[200] = {
        schema: {
          message: 'Usuario deletado com sucesso'
        }
      }
      #swagger.responses[400] = {
        schema: {
          error: 'Formato de id invalido!'
        }
      }
      #swagger.responses[403] = {
        schema: {
          message: 'Você não tem autorização para este recurso.'
        }
      }
      #swagger.responses[404] = {
        schema: {
          message: 'Não se encontrou nenhum usuario como o id informado '
        }
      }
    */
    try {
      const { user_id } = req.params;
      const userId = Number(user_id);

      if (!userId) throw new Error("Formato de id invalido!");

      const findUserById = await User.findOne({
        where: {
          id: {
            [Op.eq]: userId,
          },
        },
      });

      if (!findUserById)
        return res.status(404).json({
          error: "Não se encontrou nenhum usuario como o id informado ",
        });

      await User.destroy({
        where: {
          id: {
            [Op.eq]: userId,
          },
        },
      });

      return res.status(200).json({ message: "Usuario deletado com sucesso" });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },
};
