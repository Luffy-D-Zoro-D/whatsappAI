import mongoose, { Schema, Document } from 'mongoose';

export interface IConfig extends Document {
    allowedNumbers: string[];
    triggerKeyword: string;
}

const ConfigSchema: Schema = new Schema({
    allowedNumbers: { type: [String], default: [] },
    triggerKeyword: { type: String, default: '' }
});

export const Config = mongoose.model<IConfig>('Config', ConfigSchema);
