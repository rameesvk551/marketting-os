import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class AutomationRule extends Model {
        static associate(models: any) {
            AutomationRule.belongsTo(models.Tenant, {
                foreignKey: 'tenant_id',
                as: 'tenant',
            });
        }
    }

    AutomationRule.init(
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
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            is_active: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
            trigger: {
                type: DataTypes.JSONB,
                defaultValue: {},
            },
            conditions: {
                type: DataTypes.JSONB,
                defaultValue: [],
            },
            actions: {
                type: DataTypes.JSONB,
                defaultValue: [],
            },
        },
        {
            sequelize,
            tableName: 'whatsapp_automation_rules',
            underscored: true,
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        }
    );

    return AutomationRule;
};
