import { Injectable, Logger } from '@nestjs/common';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class TemplateService {
    private readonly logger = new Logger(TemplateService.name);
    private readonly templatesPath = path.join(process.cwd(), 'src', 'domains', 'janmasethu', 'documents', 'templates');

    /**
     * Renders an HTML template with the provided data.
     */
    async renderTemplate(templateName: string, data: any): Promise<string> {
        const filePath = path.join(this.templatesPath, `${templateName}.html`);

        if (!fs.existsSync(filePath)) {
            throw new Error(`Template not found: ${filePath}`);
        }

        const templateSource = fs.readFileSync(filePath, 'utf8');
        const template = handlebars.compile(templateSource);

        return template(data);
    }
}
