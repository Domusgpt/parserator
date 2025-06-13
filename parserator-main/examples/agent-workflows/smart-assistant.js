/**
 * Smart Assistant Agent Example - Google ADK Integration
 * 
 * This example shows how to integrate Parserator with Google's Agent Development Kit
 * to create a smart assistant that can parse natural language commands into
 * structured actions.
 * 
 * EMA Compliance:
 * - All parsed data can be exported via getExportData()
 * - Migration to other agent frameworks documented below
 * - Uses standard JSON schemas for maximum portability
 */

const { Parserator } = require('@parserator/javascript-sdk');

// Initialize Parserator client
const parserator = new Parserator({
  apiKey: process.env.PARSERATOR_API_KEY,
  enableExport: true, // EMA requirement: always enable export
});

// Define reusable schemas for different command types
const COMMAND_SCHEMAS = {
  meeting: {
    action: 'string',
    contact: 'string',
    datetime: 'string',
    topic: 'string',
    priority: 'string'
  },
  reminder: {
    action: 'string',
    task: 'string',
    datetime: 'string',
    recurring: 'boolean'
  },
  email: {
    action: 'string',
    recipient: 'string',
    subject: 'string',
    urgency: 'string'
  }
};

class SmartAssistant {
  constructor() {
    this.commandHistory = [];
    this.userPreferences = {};
  }

  /**
   * Parse natural language command into structured action
   */
  async parseCommand(userInput, context = {}) {
    try {
      // First, determine the type of command
      const commandType = await this.detectCommandType(userInput);
      
      // Parse using appropriate schema
      const schema = COMMAND_SCHEMAS[commandType] || COMMAND_SCHEMAS.meeting;
      
      const result = await parserator.parse({
        inputData: userInput,
        outputSchema: schema,
        context: {
          userPreferences: this.userPreferences,
          previousCommands: this.commandHistory.slice(-3),
          ...context
        }
      });

      // Store for export capability (EMA compliance)
      this.commandHistory.push({
        timestamp: new Date().toISOString(),
        input: userInput,
        output: result.data,
        schema: schema,
        confidence: result.confidence
      });

      return result;
    } catch (error) {
      console.error('Command parsing failed:', error);
      throw error;
    }
  }

  /**
   * Detect the type of command to apply appropriate schema
   */
  async detectCommandType(userInput) {
    const typeDetectionResult = await parserator.parse({
      inputData: userInput,
      outputSchema: {
        commandType: {
          type: 'string',
          enum: ['meeting', 'reminder', 'email', 'other']
        },
        confidence: 'number'
      }
    });

    return typeDetectionResult.data.commandType;
  }

  /**
   * Execute the parsed command
   */
  async executeCommand(parsedCommand) {
    switch (parsedCommand.action) {
      case 'create_meeting':
        return await this.createMeeting(parsedCommand);
      case 'set_reminder':
        return await this.setReminder(parsedCommand);
      case 'send_email':
        return await this.sendEmail(parsedCommand);
      default:
        throw new Error(`Unknown action: ${parsedCommand.action}`);
    }
  }

  async createMeeting(meetingData) {
    // Implementation would integrate with calendar API
    console.log('Creating meeting:', meetingData);
    return {
      success: true,
      meetingId: 'mtg_' + Date.now(),
      details: meetingData
    };
  }

  async setReminder(reminderData) {
    // Implementation would integrate with reminder system
    console.log('Setting reminder:', reminderData);
    return {
      success: true,
      reminderId: 'rem_' + Date.now(),
      details: reminderData
    };
  }

  async sendEmail(emailData) {
    // Implementation would integrate with email API
    console.log('Sending email:', emailData);
    return {
      success: true,
      emailId: 'email_' + Date.now(),
      details: emailData
    };
  }

  /**
   * EMA Compliance: Export all user data for migration
   */
  async getExportData() {
    return {
      commandHistory: this.commandHistory,
      userPreferences: this.userPreferences,
      schemas: COMMAND_SCHEMAS,
      exportMetadata: {
        version: '1.0',
        timestamp: new Date().toISOString(),
        format: 'parserator-smart-assistant-v1'
      },
      migrationInstructions: {
        langchain: 'See examples/migration-guides/langchain-migration.md',
        adk: 'Native format - no migration needed',
        crewai: 'See examples/migration-guides/crewai-migration.md',
        custom: 'JSON format compatible with any agent framework'
      }
    };
  }

  /**
   * EMA Compliance: Import data from export (for migration testing)
   */
  async importData(exportData) {
    if (exportData.exportMetadata?.format === 'parserator-smart-assistant-v1') {
      this.commandHistory = exportData.commandHistory || [];
      this.userPreferences = exportData.userPreferences || {};
      return { success: true, imported: true };
    }
    throw new Error('Unsupported export format');
  }
}

// Example usage
async function example() {
  const assistant = new SmartAssistant();

  // Example 1: Meeting scheduling
  const meetingCommand = "Schedule a call with Sarah tomorrow at 3pm about Q4 budget";
  const meetingResult = await assistant.parseCommand(meetingCommand);
  console.log('Parsed meeting:', meetingResult.data);

  // Example 2: Reminder setting
  const reminderCommand = "Remind me to review the proposal every Friday at 2pm";
  const reminderResult = await assistant.parseCommand(reminderCommand);
  console.log('Parsed reminder:', reminderResult.data);

  // Example 3: Email composition
  const emailCommand = "Send urgent email to john@company.com about the deadline change";
  const emailResult = await assistant.parseCommand(emailCommand);
  console.log('Parsed email:', emailResult.data);

  // EMA Compliance: Demonstrate export capability
  const exportData = await assistant.getExportData();
  console.log('Export data:', JSON.stringify(exportData, null, 2));
}

// Framework Migration Examples
const MIGRATION_EXAMPLES = {
  // LangChain migration
  langchain: `
    from langchain.tools import Tool
    from parserator_client import Parserator
    
    parserator = Parserator(api_key="your_key")
    
    def smart_assistant_tool(input_text: str) -> str:
        result = parserator.parse(
            input_data=input_text,
            output_schema=COMMAND_SCHEMAS['meeting']
        )
        return json.dumps(result.data)
    
    smart_assistant = Tool(
        name="smart_assistant",
        description="Parse natural language commands",
        func=smart_assistant_tool
    )
  `,

  // CrewAI migration
  crewai: `
    from crewai import Agent, Task, Tool
    from parserator_client import Parserator
    
    parserator = Parserator(api_key="your_key")
    
    @Tool
    def parse_command(command: str) -> dict:
        return parserator.parse(
            input_data=command,
            output_schema=COMMAND_SCHEMAS['meeting']
        ).data
    
    assistant_agent = Agent(
        role='Smart Assistant',
        tools=[parse_command]
    )
  `,

  // MCP (Universal) migration
  mcp: `
    // Any MCP-compatible agent can use:
    mcp://parserator/parse?schema=meeting&text=${encodeURIComponent(userInput)}
    
    // Or via npm package:
    npm install parserator-mcp-server
  `
};

module.exports = { SmartAssistant, COMMAND_SCHEMAS, MIGRATION_EXAMPLES };

if (require.main === module) {
  example().catch(console.error);
}