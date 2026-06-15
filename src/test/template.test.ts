// template.test.ts
import { describe, expect, it } from '@jest/globals';
import { applicationStatusUpdateTemplate } from '../template/template.js';

describe('applicationStatusUpdateTemplate', () => {

    it('should return an HTML string with the job title interpolated', () => {
        const result = applicationStatusUpdateTemplate('Software Engineer');

        expect(result).toContain('<strong>Software Engineer</strong>');
    });

    it('should contain required HTML structure and static content', () => {
        const result = applicationStatusUpdateTemplate('Data Analyst');

        expect(result).toContain('<!DOCTYPE html>');
        expect(result).toContain('Application Status Update');
        expect(result).toContain('HireHeaven');
        expect(result).toContain('© 2025 HireHeaven. All rights reserved.');
        expect(result).toContain('This is an automated message, please do not reply.');
    });
});
