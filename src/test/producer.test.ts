// kafka.test.ts

import { jest, describe, beforeEach, expect, it } from '@jest/globals';

const mockAdminConnect = jest.fn<() => Promise<void>>();
const mockAdminListTopics = jest.fn<() => Promise<string[]>>();
const mockAdminCreateTopics = jest.fn<() => Promise<void>>();
const mockAdminDisconnect = jest.fn<() => Promise<void>>();

const mockProducerConnect = jest.fn<() => Promise<void>>();
const mockProducerSend = jest.fn<() => Promise<void>>();
const mockProducerDisconnect = jest.fn<() => Promise<void>>();

const mockAdmin = {
    connect: mockAdminConnect,
    listTopics: mockAdminListTopics,
    createTopics: mockAdminCreateTopics,
    disconnect: mockAdminDisconnect,
};

const mockProducer = {
    connect: mockProducerConnect,
    send: mockProducerSend,
    disconnect: mockProducerDisconnect,
};

const mockKafkaInstance = {
    admin: jest.fn(() => mockAdmin),
    producer: jest.fn(() => mockProducer),
};

const mockKafka = jest.fn(() => mockKafkaInstance);

const mockDotenvConfig = jest.fn();

jest.unstable_mockModule('kafkajs', () => ({
    Kafka: mockKafka,
}));

jest.unstable_mockModule('dotenv', () => ({
    default: {
        config: mockDotenvConfig,
    },
}));

describe('kafka utils', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
        mockAdminConnect.mockResolvedValue(undefined);
        mockAdminDisconnect.mockResolvedValue(undefined);
        mockAdminCreateTopics.mockResolvedValue(undefined);
        mockProducerConnect.mockResolvedValue(undefined);
        mockProducerSend.mockResolvedValue(undefined);
        mockProducerDisconnect.mockResolvedValue(undefined);
        process.env.KAFKA_BROKER = 'localhost:9092';
    });

    it('should connect to kafka successfully and create topic', async () => {
        mockAdminListTopics.mockResolvedValue([]);

        const consoleSpy = jest
            .spyOn(console, 'log')
            .mockImplementation(() => {});

        const { connectKafka } = await import('../../src/utils/producer.js');

        await connectKafka();

        expect(mockKafka as any).toHaveBeenCalledWith({
            clientId: 'auth-service',
            brokers: ['localhost:9092'],
        });

        expect(mockAdminConnect as any).toHaveBeenCalled();

        expect(mockAdminCreateTopics as any).toHaveBeenCalledWith({
            topics: [
                {
                    topic: 'send-mail',
                    numPartitions: 1,
                    replicationFactor: 1,
                },
            ],
        });

        expect(mockProducerConnect).toHaveBeenCalled();

        expect(consoleSpy).toHaveBeenCalledWith(
            'Connected to kafka producer.'
        );

        consoleSpy.mockRestore();
    });

    it('should connect without creating topic if topic exists', async () => {
        mockAdminListTopics.mockResolvedValue(['send-mail']);

        const { connectKafka } = await import('../../src/utils/producer.js');

        await connectKafka();

        expect(mockAdminCreateTopics).not.toHaveBeenCalled();
    });

    it('should handle kafka connection failure', async () => {
        mockAdminConnect.mockRejectedValue(
            new Error('Kafka failed')
        );

        const consoleSpy = jest
            .spyOn(console, 'log')
            .mockImplementation(() => {});

        const { connectKafka } = await import('../../src/utils/producer.js');

        await connectKafka();

        expect(consoleSpy).toHaveBeenCalledWith(
            'Failed to connect to kafka.'
        );

        consoleSpy.mockRestore();
    });

    it('should publish message successfully', async () => {
        mockAdminListTopics.mockResolvedValue([]);

        const { connectKafka, publishToTopic } =
            await import('../../src/utils/producer.js');

        await connectKafka();

        await publishToTopic('send-mail', {
            email: 'test@test.com',
        });

        expect(mockProducerSend as any).toHaveBeenCalledWith({
            topic: 'send-mail',
            messages: [
                {
                    value: JSON.stringify({
                        email: 'test@test.com',
                    }),
                },
            ],
        });
    });

    it('should handle publish failure', async () => {
    mockAdminListTopics.mockResolvedValue(['send-mail']);

    mockProducerSend.mockRejectedValue(
        new Error('Publish failed')
    );

    const consoleSpy = jest
        .spyOn(console, 'log')
        .mockImplementation(() => {});

    const { connectKafka, publishToTopic } =
        await import('../../src/utils/producer.js');

    await connectKafka();

    await publishToTopic('send-mail', {
        email: 'test@test.com',
    });

    expect(mockProducerSend).toHaveBeenCalled();

    expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to publish message to topic:',
        expect.any(Error)
    );

    consoleSpy.mockRestore();
});

    it('should handle producer not initialized', async () => {
        const consoleSpy = jest
            .spyOn(console, 'log')
            .mockImplementation(() => {});

        const { publishToTopic } =
            await import('../../src/utils/producer.js');

        await publishToTopic('send-mail', {
            email: 'test@test.com',
        });

        expect(consoleSpy).toHaveBeenCalledWith(
            'Kafka producer is not initialised.'
        );

        consoleSpy.mockRestore();
    });

    it('should disconnect kafka producer', async () => {
    mockAdminListTopics.mockResolvedValue(['send-mail']);

    const { connectKafka, disconnectKafka } =
        await import('../../src/utils/producer.js');

    await connectKafka();

    expect(mockProducerConnect).toHaveBeenCalled();

    await disconnectKafka();

    expect(mockProducerDisconnect).toHaveBeenCalled();
});

    it('should not disconnect if producer does not exist', async () => {
        const { disconnectKafka } =
            await import('../../src/utils/producer.js');

        await disconnectKafka();

        expect(mockProducerDisconnect).not.toHaveBeenCalled();
    });
});