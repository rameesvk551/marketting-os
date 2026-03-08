import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class WhatsappAppointment extends Model {
        static associate(models: any) {
            WhatsappAppointment.belongsTo(models.Tenant, {
                foreignKey: 'tenant_id',
                as: 'tenant',
            });
        }
    }

    WhatsappAppointment.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            tenant_id: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            contact_name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            contact_phone: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            service_type: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            appointment_date: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            status: {
                type: DataTypes.STRING,
                defaultValue: 'SCHEDULED',
                allowNull: false,
            },
        },
        {
            sequelize,
            tableName: 'whatsapp_appointments',
            underscored: true,
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        }
    );

    return WhatsappAppointment;
};
