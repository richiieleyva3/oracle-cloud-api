const oracledb = require('oracledb');
oracledb.initOracleClient({ libDir: '/usr/lib/oracle/19.19/client64/lib' });

oracledb.outFormat = oracledb.OBJECT;
oracledb.fetchAsString = [oracledb.CLOB];
oracledb.autoCommit = true;

const CLIENTES_COLLECTION = 'clientes';

module.exports = class ClienteService {
    constructor() { }

    static async init() {
        console.log(`process.env.DB_USER: ${process.env.DB_USER}`);
        console.log(`process.env.DB_PASSWORD: ${process.env.DB_PASSWORD}`);
        console.log(`process.env.CONNECT_STRING: lib'${process.env.CONNECT_STRING}`);
        console.log(`process.env.TNS_ADMIN: ${process.env.TNS_ADMIN}`);

        console.log('Creando pool de conexiones...')
        await oracledb.createPool({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            connectString: process.env.CONNECT_STRING,
            tnsAdmin: process.env.TNS_ADMIN,
            walletLocation: process.env.TNS_ADMIN,
            externalAuth: false,
        });
        console.log('Pool de conexiones creado.')
        return new ClienteService();
    }

    async getAll() {
        let connection;
        const result = [];

        try {
            connection = await oracledb.getConnection();

            const soda = connection.getSodaDatabase();
            const clienteCollection = await soda.createCollection(CLIENTES_COLLECTION);
            let clientes = await clienteCollection.find().getDocuments();
            clientes.forEach((element) => {
                result.push({
                    id: element.key,
                    createdOn: element.createdOn,
                    lastModified: element.lastModified,
                    ...element.getContent(),
                });
            });
        } catch (err) {
            console.error(err);
        } finally {
            if (connection) {
                try {
                    await connection.close();
                }
                catch (err) {
                    console.error(err);
                }
            }
        }
        return result;
    }

    async getById(clienteId) {
        let connection, cliente, result;

        try {
            connection = await oracledb.getConnection();

            const soda = connection.getSodaDatabase();
            const clientesCollection = await soda.createCollection(CLIENTES_COLLECTION);
            cliente = await clientesCollection.find().key(clienteId).getOne();
            result = {
                id: cliente.key,
                createdOn: cliente.createdOn,
                lastModified: cliente.lastModified,
                ...cliente.getContent(),
            };

        } catch (err) {
            console.error(err);
        } finally {
            if (connection) {
                try {
                    await connection.close();
                }
                catch (err) {
                    console.error(err);
                }
            }
        }

        return result;
    }

    async save(cliente) {
        let connection, novoCliente, result;

        try {
            connection = await oracledb.getConnection();
            const soda = connection.getSodaDatabase();
            const clientesCollection = await soda.createCollection(CLIENTES_COLLECTION);
            /*
                insertOneAndGet() does not return the doc
                for performance reasons
                see: http://oracle.github.io/node-oracledb/doc/api.html#sodacollinsertoneandget
            */
            novoCliente = await clientesCollection.insertOneAndGet(cliente);
            result = {
                id: novoCliente.key,
                createdOn: novoCliente.createdOn,
                lastModified: novoCliente.lastModified,
            };
        } catch (err) {
            console.error(err);
        } finally {
            if (connection) {
                try {
                    await connection.close();
                }
                catch (err) {
                    console.error(err);
                }
            }
        }

        return result;
    }

    async update(id, cliente) {
        let connection, result;

        try {
            connection = await oracledb.getConnection();
            const soda = connection.getSodaDatabase();
            const clienteCollection = await soda.createCollection(CLIENTES_COLLECTION);
            cliente = await clienteCollection.find().key(id).replaceOneAndGet(cliente);
            result = {
                id: cliente.key,
                createdOn: cliente.createdOn,
                lastModified: cliente.lastModified,
            };
        } catch (err) {
            console.error(err);
        } finally {
            if (connection) {
                try {
                    await connection.close();
                }
                catch (err) {
                    console.error(err);
                }
            }
        }

        return result;
    }

    async deleteById(clienteId) {
        let connection;
        let removed = false;

        try {
            connection = await oracledb.getConnection();

            const soda = connection.getSodaDatabase();
            const clienteCollection = await soda.createCollection(CLIENTES_COLLECTION);
            removed = await clienteCollection.find().key(clienteId).remove();

        } catch (err) {
            console.error(err);
        } finally {
            if (connection) {
                try {
                    await connection.close();
                }
                catch (err) {
                    console.error(err);
                }
            }
        }
        return removed;
    }

    async closePool() {
        console.log('Cerrando conexion...');
        try {
            await oracledb.getPool().close(10);
            console.log('Pool cerrado');
        } catch (err) {
            console.error(err);
        }
    }
}
