/**
 * Message protocol handler for CLI communication
 */

export interface Message {
  request_id: string;
  [key: string]: any;
}

export class ProtocolHandler {
  private buffer: string = '';

  /**
   * Process incoming data and extract complete JSON messages
   */
  processData(data: string): Message[] {
    this.buffer += data;
    const messages: Message[] = [];
    const lines = this.buffer.split('\n');

    // Keep last incomplete line in buffer
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.trim()) {
        try {
          const message = JSON.parse(line);
          messages.push(message);
        } catch (error) {
          console.error('Failed to parse message:', line, error);
        }
      }
    }

    return messages;
  }

  /**
   * Serialize message to JSON string with newline
   */
  serializeMessage(message: Message): string {
    return JSON.stringify(message) + '\n';
  }

  /**
   * Clear the buffer
   */
  clearBuffer(): void {
    this.buffer = '';
  }
}
