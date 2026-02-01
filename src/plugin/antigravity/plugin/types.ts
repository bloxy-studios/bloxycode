import type { PluginInput, ToolDefinition } from "@opencode-ai/plugin";
import type { AntigravityTokenExchangeResult } from "../antigravity/oauth";

export interface OAuthAuthDetails {
  type: "oauth";
  refresh: string;
  access?: string;
  expires?: number;
}

export interface ApiKeyAuthDetails {
  type: "api_key";
  key: string;
}

export interface NonOAuthAuthDetails {
  type: string;
  [key: string]: unknown;
}

export type AuthDetails = OAuthAuthDetails | ApiKeyAuthDetails | NonOAuthAuthDetails;

export type GetAuth = () => Promise<AuthDetails>;

export interface ProviderModel {
  cost?: {
    input: number;
    output: number;
  };
  [key: string]: unknown;
}

export interface Provider {
  models?: Record<string, ProviderModel>;
}

export interface LoaderResult {
  apiKey: string;
  fetch(input: RequestInfo, init?: RequestInit): Promise<Response>;
}

export type PluginClient = PluginInput["client"];

export interface PluginContext {
  client: PluginClient;
  directory: string;
}

export type AuthPrompt =
  | {
      type: "text";
      key: string;
      message: string;
      placeholder?: string;
      validate?: (value: string) => string | undefined;
      condition?: (inputs: Record<string, string>) => boolean;
    }
  | {
      type: "select";
      key: string;
      message: string;
      options: Array<{ label: string; value: string; hint?: string }>;
      condition?: (inputs: Record<string, string>) => boolean;
    };

export type OAuthAuthorizationResult = { url: string; instructions: string } & (
  | {
      method: "auto";
      callback: () => Promise<AntigravityTokenExchangeResult>;
    }
  | {
      method: "code";
      callback: (code: string) => Promise<AntigravityTokenExchangeResult>;
    }
);

export type AuthMethod =
  | {
      type: "oauth";
      label: string;
      provider?: string;
      prompts?: AuthPrompt[];
      authorize: (inputs?: Record<string, string>) => Promise<OAuthAuthorizationResult>;
    }
  | {
      type: "api";
      label: string;
      provider?: string;
      prompts?: AuthPrompt[];
      authorize?: (inputs?: Record<string, string>) => Promise<{
        type: "success";
        key: string;
        provider?: string;
      } | {
        type: "failed";
      }>;
    };

export interface PluginEventPayload {
  event: {
    type: string;
    properties?: unknown;
  };
}

export interface PluginResult {
  auth: {
    provider: string;
    loader: (getAuth: GetAuth, provider: Provider) => Promise<LoaderResult | Record<string, unknown>>;
    methods: AuthMethod[];
  };
  event?: (input: { event: { type: string; properties?: unknown } }) => Promise<void>;
  tool?: { [key: string]: ToolDefinition };
}

export interface RefreshParts {
  refreshToken: string;
  projectId?: string;
  managedProjectId?: string;
}

export interface ProjectContextResult {
  auth: OAuthAuthDetails;
  effectiveProjectId: string;
}

