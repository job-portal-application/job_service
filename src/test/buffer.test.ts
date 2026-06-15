// getBuffer.test.ts

import { jest, describe, beforeEach, expect, it } from '@jest/globals';

const mockFormat = jest.fn<() => any>();

const mockParserInstance = {
    format: mockFormat,
};

const mockParser = jest.fn(() => mockParserInstance);

const mockExtname = jest.fn();

jest.unstable_mockModule('datauri/parser.js', () => ({
    default: mockParser,
}));

jest.unstable_mockModule('path', () => ({
    default: {
        extname: mockExtname,
    },
}));

describe('getBuffer utility', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
    });

    it('should extract extension from original filename', async () => {
        mockExtname.mockReturnValue('.pdf');

        mockFormat.mockReturnValue({
            content: 'mock-content',
        });

        const { default: getBuffer } = await import('../utils/buffer.js');

        const file = {
            originalname: 'resume.pdf',
            buffer: Buffer.from('test'),
        };

        getBuffer(file);

        expect(mockExtname).toHaveBeenCalledWith('resume.pdf');
    });

    it('should format file buffer using parser', async () => {
        mockExtname.mockReturnValue('.pdf');

        mockFormat.mockReturnValue({
            content: 'mock-content',
        });

        const { default: getBuffer } = await import('../utils/buffer.js');

        const file = {
            originalname: 'resume.pdf',
            buffer: Buffer.from('test'),
        };

        getBuffer(file);

        expect(mockFormat as any).toHaveBeenCalledWith(
            '.pdf',
            file.buffer
        );
    });

    it('should return formatted buffer data', async () => {
        const formattedData = {
            content: 'mock-content',
        };

        mockExtname.mockReturnValue('.pdf');

        mockFormat.mockReturnValue(formattedData);

        const { default: getBuffer } = await import('../utils/buffer.js');

        const file = {
            originalname: 'resume.pdf',
            buffer: Buffer.from('test'),
        };

        const result = getBuffer(file);

        expect(result).toEqual(formattedData);
    });

    it('should create parser instance', async () => {
        mockExtname.mockReturnValue('.pdf');

        mockFormat.mockReturnValue({
            content: 'mock-content',
        });

        const { default: getBuffer } = await import('../utils/buffer.js');

        const file = {
            originalname: 'resume.pdf',
            buffer: Buffer.from('test'),
        };

        getBuffer(file);

        expect(mockParser).toHaveBeenCalled();
    });
});