## Basic

ANTHROPIC_API_KEYという環境変数にAnthropicのAPIキーが設定されています。

```shell
npm i @langchain/anthropic @langchain/core
```

```
import { ChatAnthropic } from "@langchain/anthropic";

const llm = new ChatAnthropic({
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  model: "claude-3-haiku-20240307",
  temperature: 0,
  maxTokens: undefined,
  maxRetries: 2,
  // other params...
});

const aiMsg = await llm.invoke([
  [
    "system",
    "You are a helpful assistant that translates English to French. Translate the user sentence.",
  ],
  ["human", "I love programming."],
]);

```


aiMsg would be:
```
AIMessage {
  "id": "msg_013WBXXiggy6gMbAUY6NpsuU",
  "content": "Voici la traduction en français :\n\nJ'adore la programmation.",
  "additional_kwargs": {
    "id": "msg_013WBXXiggy6gMbAUY6NpsuU",
    "type": "message",
    "role": "assistant",
    "model": "claude-3-haiku-20240307",
    "stop_reason": "end_turn",
    "stop_sequence": null,
    "usage": {
      "input_tokens": 29,
      "output_tokens": 20
    }
  },
  "response_metadata": {
    "id": "msg_013WBXXiggy6gMbAUY6NpsuU",
    "model": "claude-3-haiku-20240307",
    "stop_reason": "end_turn",
    "stop_sequence": null,
    "usage": {
      "input_tokens": 29,
      "output_tokens": 20
    },
    "type": "message",
    "role": "assistant"
  },
  "tool_calls": [],
  "invalid_tool_calls": [],
  "usage_metadata": {
    "input_tokens": 29,
    "output_tokens": 20,
    "total_tokens": 49
  }
}
```

```
console.log(aiMsg.content);
=>  Voici la traduction en français :

J'adore la programmation.
```


# Chaining
```
import { ChatPromptTemplate } from "@langchain/core/prompts";

const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    "You are a helpful assistant that translates {input_language} to {output_language}.",
  ],
  ["human", "{input}"],
]);

const chain = prompt.pipe(llm);
const aiMsg = await chain.invoke({
  input_language: "English",
  output_language: "German",
  input: "I love programming.",
});
```

aiMsg would be:
```
AIMessage {
  "id": "msg_01Ca52fpd1mcGRhH4spzAWr4",
  "content": "Ich liebe das Programmieren.",
  "additional_kwargs": {
    "id": "msg_01Ca52fpd1mcGRhH4spzAWr4",
    "type": "message",
    "role": "assistant",
    "model": "claude-3-haiku-20240307",
    "stop_reason": "end_turn",
    "stop_sequence": null,
    "usage": {
      "input_tokens": 23,
      "output_tokens": 11
    }
  },
  "response_metadata": {
    "id": "msg_01Ca52fpd1mcGRhH4spzAWr4",
    "model": "claude-3-haiku-20240307",
    "stop_reason": "end_turn",
    "stop_sequence": null,
    "usage": {
      "input_tokens": 23,
      "output_tokens": 11
    },
    "type": "message",
    "role": "assistant"
  },
  "tool_calls": [],
  "invalid_tool_calls": [],
  "usage_metadata": {
    "input_tokens": 23,
    "output_tokens": 11,
    "total_tokens": 34
  }
}
```

## tool use

```
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const calculatorSchema = z.object({
  operation: z
    .enum(["add", "subtract", "multiply", "divide"])
    .describe("The type of operation to execute."),
  number1: z.number().describe("The first number to operate on."),
  number2: z.number().describe("The second number to operate on."),
});

const calculatorTool = {
  name: "calculator",
  description: "A simple calculator tool",
  input_schema: zodToJsonSchema(calculatorSchema),
};

const toolCallingLlm = new ChatAnthropic({
  model: "claude-3-haiku-20240307",
}).bindTools([calculatorTool]);

const toolPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    "You are a helpful assistant who always needs to use a calculator.",
  ],
  ["human", "{input}"],
]);

// Chain your prompt and model together
const toolCallChain = toolPrompt.pipe(toolCallingLlm);

const aiMsg = await toolCallChain.invoke({
  input: "What is 2 + 2?",
});
```

aiMsg would be:
```
AIMessage {
  "id": "msg_01DZGs9DyuashaYxJ4WWpWUP",
  "content": [
    {
      "type": "text",
      "text": "Here is the calculation for 2 + 2:"
    },
    {
      "type": "tool_use",
      "id": "toolu_01SQXBamkBr6K6NdHE7GWwF8",
      "name": "calculator",
      "input": {
        "number1": 2,
        "number2": 2,
        "operation": "add"
      }
    }
  ],
  "additional_kwargs": {
    "id": "msg_01DZGs9DyuashaYxJ4WWpWUP",
    "type": "message",
    "role": "assistant",
    "model": "claude-3-haiku-20240307",
    "stop_reason": "tool_use",
    "stop_sequence": null,
    "usage": {
      "input_tokens": 449,
      "output_tokens": 100
    }
  },
  "response_metadata": {
    "id": "msg_01DZGs9DyuashaYxJ4WWpWUP",
    "model": "claude-3-haiku-20240307",
    "stop_reason": "tool_use",
    "stop_sequence": null,
    "usage": {
      "input_tokens": 449,
      "output_tokens": 100
    },
    "type": "message",
    "role": "assistant"
  },
  "tool_calls": [
    {
      "name": "calculator",
      "args": {
        "number1": 2,
        "number2": 2,
        "operation": "add"
      },
      "id": "toolu_01SQXBamkBr6K6NdHE7GWwF8",
      "type": "tool_call"
    }
  ],
  "invalid_tool_calls": [],
  "usage_metadata": {
    "input_tokens": 449,
    "output_tokens": 100,
    "total_tokens": 549
  }
}
```
