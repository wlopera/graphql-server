import { ApolloServer, UserInputError, gql } from "apollo-server";
import { v1 as uuid } from "uuid";
import axios from "axios";

// Data DUMMY
const persons = [
  {
    name: "Neymar",
    phone: "034-1234567",
    street: "Calle Frotend",
    city: "Barcelona",
    id: "3d599650-3436-11eb-8b800ba54c431",
  },
  {
    name: "Messi",
    phone: "044-123456",
    street: "Avenida Fullstack",
    city: "Mataro",
    id: "3d599470-3436-11eb-8b800ba54c431",
  },
  {
    name: "Ronaldo",
    street: "Pasaje Testing",
    city: "Ibitza",
    id: "3d599471-3436-11eb-8b800ba54c431",
  },
];

// Tipos de datos y consultas
// ! => Obligatorio
// Query metodos de consulta expuestos
const typeDefinitions = gql`
  enum YesNo {
    YES
    NO
  }

  type Address {
    street: String!
    city: String!
  }

  type Person {
    name: String!
    phone: String
    address: Address!
    #check: String!
    id: ID!
  }

  type Query {
    personCount: Int!
    allPersons(phone: YesNo): [Person]!
    findPerson(name: String!): Person
  }

  type Mutation {
    addPerson(
      name: String!
      phone: String
      street: String!
      city: String!
    ): Person
    editNumber(name: String!, phone: String!): Person
  }
`;

// Resolvedores:  Como se obtiene y sacan los datos
const resolvers = {
  Query: {
    personCount: () => persons.length,
    allPersons: async (root, args) => {
      const { data: personsFromRestApi } = await axios.get(
        "http://localhost:3000/persons"
      );

      if (!args.phone) {
        return personsFromRestApi;
      }
      return personsFromRestApi.filter((person) =>
        args.phone === "YES" ? person.phone : !person.phone
      );
    },
    findPerson: (root, args) => {
      const { name } = args;
      return persons.find((person) => person.name === name);
    },
  },
  Mutation: {
    addPerson: (root, args) => {
      if (persons.find((person) => person.name === args.name)) {
        throw new UserInputError("Nombre debe ser único", {
          invalidArgs: args.name,
        });
      }
      const person = { ...args, id: uuid() };
      persons.push(person);
      return person;
    },
    editNumber: (root, args) => {
      const personIndex = persons.findIndex(
        (person) => person.name === args.name
      );

      if (personIndex === -1) {
        return null;
      }
      const personUpdate = persons[personIndex];
      persons[personIndex] = { ...personUpdate, phone: args.phone };

      return personUpdate;
    },
  },
  //Person: {
  //  address: (root) => `${root.street} - ${root.city}`,
  //  check: () => "Chequeo de prueba",
  //},
  Person: {
    address: (root) => ({
      street: root.street,
      city: root.city,
    }),
  },
};

// Generar srevidors Apollo
const server = new ApolloServer({
  typeDefs: typeDefinitions,
  resolvers,
});

server.listen().then(({ url }) => {
  console.log(`Servidor Listo en ${url}`);
});
