#!/usr/bin/env node
/**
 * MCP Server generated from OpenAPI spec for klaviyo-mcp v2026-04-15
 * Generated on: 2026-06-27T23:12:15.413Z
 */

// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
  type CallToolResult,
  type CallToolRequest
} from "@modelcontextprotocol/sdk/types.js";

import { z, ZodError } from 'zod';
import { jsonSchemaToZod } from 'json-schema-to-zod';
import axios, { type AxiosRequestConfig, type AxiosError } from 'axios';

/**
 * Type definition for JSON objects
 */
type JsonObject = Record<string, any>;

/**
 * Interface for MCP Tool Definition
 */
interface McpToolDefinition {
    name: string;
    description: string;
    inputSchema: any;
    method: string;
    pathTemplate: string;
    executionParameters: { name: string, in: string }[];
    requestBodyContentType?: string;
    securityRequirements: any[];
    tags?: string[];
    deprecated?: boolean;
}

/**
 * Server configuration
 */
export const SERVER_NAME = "klaviyo-mcp";
export const SERVER_VERSION = "2026-04-15";
// Base URL for the API, can be set via environment variable or determined from OpenAPI spec
export const API_BASE_URL = process.env.API_BASE_URL || "https://a.klaviyo.com";
console.error("API_BASE_URL is set to:", API_BASE_URL);

/**
 * MCP Server instance
 */
const server = new Server(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { capabilities: { tools: {} } }
);

/**
 * Map of tool definitions by name
 */
const toolDefinitionMap: Map<string, McpToolDefinition> = new Map([

  ["get_profiles", {
    name: "get_profiles",
    description: `No bulk export endpoint exists. Follow the cursor: each response includes links.next — loop until links.next is null.

Get all profiles in an account.

Profiles can be sorted by the following fields in ascending and descending order: \`id\`, \`created\`, \`updated\`, \`email\`, \`subscriptions.email.marketing.suppression.timestamp\`, \`subscriptions.email.marketing.list_suppressions.timestamp\`

Use the \`additional-fields\` parameter to include subscriptions and predictive analytics data in your response.<br><br>*Rate limits*:<br>Burst: \`75/s\`<br>Steady: \`750/m\`<br><br>Rate limits when using the \`additional-fields[profile]=predictive_analytics\` parameter in your API request:<br>Burst: \`10/s\`<br>Steady: \`150/m\`<br><br>To learn more about how the \`additional-fields\` parameter impacts rate limits, check out our [Rate limits, status codes, and errors](https://developers.klaviyo.com/en/v2026-04-15/docs/rate_limits_and_error_handling) guide.

**Scopes:**
\`profiles:read\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/get_profiles.json)
(Tags: Profiles)`,
    inputSchema: {"type":"object","properties":{"additional-fields[profile]":{"type":"array","items":{"type":"string","enum":["subscriptions","predictive_analytics"]},"description":"Request additional fields not included by default in the response. Supported values: 'subscriptions', 'predictive_analytics'"},"fields[conversation]":{"type":"array","items":{"type":"string","enum":["id"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sparse-fieldsets"},"fields[profile]":{"type":"array","items":{"type":"string","enum":["created","email","external_id","first_name","id","image","last_event_date","last_name","locale","location","location.address1","location.address2","location.city","location.country","location.ip","location.latitude","location.longitude","location.region","location.timezone","location.zip","organization","phone_number","predictive_analytics","predictive_analytics.average_days_between_orders","predictive_analytics.average_order_value","predictive_analytics.churn_probability","predictive_analytics.expected_date_of_next_order","predictive_analytics.historic_clv","predictive_analytics.historic_number_of_orders","predictive_analytics.predicted_clv","predictive_analytics.predicted_number_of_orders","predictive_analytics.ranked_channel_affinity","predictive_analytics.total_clv","properties","subscriptions","subscriptions.email","subscriptions.email.marketing","subscriptions.email.marketing.can_receive_email_marketing","subscriptions.email.marketing.consent","subscriptions.email.marketing.consent_timestamp","subscriptions.email.marketing.custom_method_detail","subscriptions.email.marketing.double_optin","subscriptions.email.marketing.last_updated","subscriptions.email.marketing.list_suppressions","subscriptions.email.marketing.method","subscriptions.email.marketing.method_detail","subscriptions.email.marketing.suppression","subscriptions.mobile_push","subscriptions.mobile_push.marketing","subscriptions.mobile_push.marketing.can_receive_push_marketing","subscriptions.mobile_push.marketing.consent","subscriptions.mobile_push.marketing.consent_timestamp","subscriptions.sms","subscriptions.sms.marketing","subscriptions.sms.marketing.can_receive_sms_marketing","subscriptions.sms.marketing.consent","subscriptions.sms.marketing.consent_timestamp","subscriptions.sms.marketing.last_updated","subscriptions.sms.marketing.method","subscriptions.sms.marketing.method_detail","subscriptions.sms.transactional","subscriptions.sms.transactional.can_receive_sms_transactional","subscriptions.sms.transactional.consent","subscriptions.sms.transactional.consent_timestamp","subscriptions.sms.transactional.last_updated","subscriptions.sms.transactional.method","subscriptions.sms.transactional.method_detail","subscriptions.whatsapp","subscriptions.whatsapp.conversational","subscriptions.whatsapp.conversational.can_receive","subscriptions.whatsapp.conversational.consent","subscriptions.whatsapp.conversational.consent_timestamp","subscriptions.whatsapp.conversational.created_timestamp","subscriptions.whatsapp.conversational.last_updated","subscriptions.whatsapp.conversational.metadata","subscriptions.whatsapp.conversational.phone_number","subscriptions.whatsapp.conversational.valid_until","subscriptions.whatsapp.marketing","subscriptions.whatsapp.marketing.can_receive","subscriptions.whatsapp.marketing.consent","subscriptions.whatsapp.marketing.consent_timestamp","subscriptions.whatsapp.marketing.created_timestamp","subscriptions.whatsapp.marketing.last_updated","subscriptions.whatsapp.marketing.metadata","subscriptions.whatsapp.marketing.phone_number","subscriptions.whatsapp.marketing.valid_until","subscriptions.whatsapp.transactional","subscriptions.whatsapp.transactional.can_receive","subscriptions.whatsapp.transactional.consent","subscriptions.whatsapp.transactional.consent_timestamp","subscriptions.whatsapp.transactional.created_timestamp","subscriptions.whatsapp.transactional.last_updated","subscriptions.whatsapp.transactional.metadata","subscriptions.whatsapp.transactional.phone_number","subscriptions.whatsapp.transactional.valid_until","title","updated"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sparse-fieldsets"},"fields[push-token]":{"type":"array","items":{"type":"string","enum":["background","created","enablement_status","id","metadata","metadata.app_build","metadata.app_id","metadata.app_name","metadata.app_version","metadata.device_id","metadata.device_model","metadata.environment","metadata.klaviyo_sdk","metadata.manufacturer","metadata.os_name","metadata.os_version","metadata.sdk_version","platform","recorded_date","token","vendor"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sparse-fieldsets"},"filter":{"type":"string","description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#filtering<br>Allowed field(s)/operator(s):<br>`id`: `any`, `equals`<br>`email`: `any`, `equals`<br>`phone_number`: `any`, `equals`<br>`external_id`: `any`, `equals`<br>`_kx`: `equals`<br>`created`: `greater-than`, `less-than`<br>`updated`: `greater-than`, `less-than`<br>`subscriptions.email.marketing.list_suppressions.reason`: `equals`<br>`subscriptions.email.marketing.list_suppressions.timestamp`: `greater-or-equal`, `greater-than`, `less-or-equal`, `less-than`<br>`subscriptions.email.marketing.list_suppressions.list_id`: `equals`<br>`subscriptions.email.marketing.suppression.reason`: `equals`<br>`subscriptions.email.marketing.suppression.timestamp`: `greater-or-equal`, `greater-than`, `less-or-equal`, `less-than`"},"include":{"type":"array","items":{"type":"string","enum":["conversation","push-tokens"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#relationships"},"page[cursor]":{"type":"string","description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#pagination"},"page[size]":{"type":"number","default":20,"maximum":100,"minimum":1,"description":"Default: 20. Min: 1. Max: 100."},"sort":{"type":"string","enum":["created","-created","email","-email","id","-id","subscriptions.email.marketing.list_suppressions.timestamp","-subscriptions.email.marketing.list_suppressions.timestamp","subscriptions.email.marketing.suppression.timestamp","-subscriptions.email.marketing.suppression.timestamp","updated","-updated"],"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sorting"},"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"}},"required":["revision"]},
    method: "get",
    pathTemplate: "/api/profiles",
    executionParameters: [{"name":"additional-fields[profile]","in":"query"},{"name":"fields[conversation]","in":"query"},{"name":"fields[profile]","in":"query"},{"name":"fields[push-token]","in":"query"},{"name":"filter","in":"query"},{"name":"include","in":"query"},{"name":"page[cursor]","in":"query"},{"name":"page[size]","in":"query"},{"name":"sort","in":"query"},{"name":"revision","in":"header"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Profiles"],
    deprecated: false
  }],
  ["create_profile", {
    name: "create_profile",
    description: `Idempotent upsert: re-sending the same email/phone/external_id silently overwrites all provided fields — no error, no duplicate. Setting a value in properties may silently update segment membership for any segment rule referencing that property key.

Create a new profile.

Use the \`additional-fields\` parameter to include subscriptions and predictive analytics data in your response.

The maximum allowed payload size is 100KB.<br><br>*Rate limits*:<br>Burst: \`75/s\`<br>Steady: \`750/m\`

**Scopes:**
\`profiles:write\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/create_profile.json)
(Tags: Profiles)`,
    inputSchema: {"type":"object","properties":{"additional-fields[profile]":{"type":"array","items":{"type":"string","enum":["subscriptions","predictive_analytics"]},"description":"Request additional fields not included by default in the response. Supported values: 'subscriptions', 'predictive_analytics'"},"fields[profile]":{"type":"array","items":{"type":"string","enum":["created","email","external_id","first_name","id","image","last_event_date","last_name","locale","location","location.address1","location.address2","location.city","location.country","location.ip","location.latitude","location.longitude","location.region","location.timezone","location.zip","organization","phone_number","predictive_analytics","predictive_analytics.average_days_between_orders","predictive_analytics.average_order_value","predictive_analytics.churn_probability","predictive_analytics.expected_date_of_next_order","predictive_analytics.historic_clv","predictive_analytics.historic_number_of_orders","predictive_analytics.predicted_clv","predictive_analytics.predicted_number_of_orders","predictive_analytics.ranked_channel_affinity","predictive_analytics.total_clv","properties","subscriptions","subscriptions.email","subscriptions.email.marketing","subscriptions.email.marketing.can_receive_email_marketing","subscriptions.email.marketing.consent","subscriptions.email.marketing.consent_timestamp","subscriptions.email.marketing.custom_method_detail","subscriptions.email.marketing.double_optin","subscriptions.email.marketing.last_updated","subscriptions.email.marketing.list_suppressions","subscriptions.email.marketing.method","subscriptions.email.marketing.method_detail","subscriptions.email.marketing.suppression","subscriptions.mobile_push","subscriptions.mobile_push.marketing","subscriptions.mobile_push.marketing.can_receive_push_marketing","subscriptions.mobile_push.marketing.consent","subscriptions.mobile_push.marketing.consent_timestamp","subscriptions.sms","subscriptions.sms.marketing","subscriptions.sms.marketing.can_receive_sms_marketing","subscriptions.sms.marketing.consent","subscriptions.sms.marketing.consent_timestamp","subscriptions.sms.marketing.last_updated","subscriptions.sms.marketing.method","subscriptions.sms.marketing.method_detail","subscriptions.sms.transactional","subscriptions.sms.transactional.can_receive_sms_transactional","subscriptions.sms.transactional.consent","subscriptions.sms.transactional.consent_timestamp","subscriptions.sms.transactional.last_updated","subscriptions.sms.transactional.method","subscriptions.sms.transactional.method_detail","subscriptions.whatsapp","subscriptions.whatsapp.conversational","subscriptions.whatsapp.conversational.can_receive","subscriptions.whatsapp.conversational.consent","subscriptions.whatsapp.conversational.consent_timestamp","subscriptions.whatsapp.conversational.created_timestamp","subscriptions.whatsapp.conversational.last_updated","subscriptions.whatsapp.conversational.metadata","subscriptions.whatsapp.conversational.phone_number","subscriptions.whatsapp.conversational.valid_until","subscriptions.whatsapp.marketing","subscriptions.whatsapp.marketing.can_receive","subscriptions.whatsapp.marketing.consent","subscriptions.whatsapp.marketing.consent_timestamp","subscriptions.whatsapp.marketing.created_timestamp","subscriptions.whatsapp.marketing.last_updated","subscriptions.whatsapp.marketing.metadata","subscriptions.whatsapp.marketing.phone_number","subscriptions.whatsapp.marketing.valid_until","subscriptions.whatsapp.transactional","subscriptions.whatsapp.transactional.can_receive","subscriptions.whatsapp.transactional.consent","subscriptions.whatsapp.transactional.consent_timestamp","subscriptions.whatsapp.transactional.created_timestamp","subscriptions.whatsapp.transactional.last_updated","subscriptions.whatsapp.transactional.metadata","subscriptions.whatsapp.transactional.phone_number","subscriptions.whatsapp.transactional.valid_until","title","updated"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sparse-fieldsets"},"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"},"requestBody":{"type":"string","description":"Request body (content type: application/vnd.api+json)"}},"required":["revision","requestBody"]},
    method: "post",
    pathTemplate: "/api/profiles",
    executionParameters: [{"name":"additional-fields[profile]","in":"query"},{"name":"fields[profile]","in":"query"},{"name":"revision","in":"header"}],
    requestBodyContentType: "application/vnd.api+json",
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Profiles"],
    deprecated: false
  }],
  ["get_profile", {
    name: "get_profile",
    description: `Get the profile with the given profile ID.

Use the \`additional-fields\` parameter to include subscriptions and predictive analytics data in your response.<br><br>*Rate limits*:<br>Burst: \`75/s\`<br>Steady: \`750/m\`<br><br>Rate limits when using the \`include=list\` parameter in your API request:<br>Burst: \`1/s\`<br>Steady: \`15/m\`<br><br>Rate limits when using the \`include=segment\` parameter in your API request:<br>Burst: \`1/s\`<br>Steady: \`15/m\`<br><br>To learn more about how the \`include\` parameter impacts rate limits, check out our [Rate limits, status codes, and errors](https://developers.klaviyo.com/en/v2026-04-15/docs/rate_limits_and_error_handling) guide.

**Scopes:**
\`profiles:read\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/get_profile.json)
(Tags: Profiles)`,
    inputSchema: {"type":"object","properties":{"id":{"type":"string"},"additional-fields[profile]":{"type":"array","items":{"type":"string","enum":["subscriptions","predictive_analytics"]},"description":"Request additional fields not included by default in the response. Supported values: 'subscriptions', 'predictive_analytics'"},"fields[conversation]":{"type":"array","items":{"type":"string","enum":["id"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sparse-fieldsets"},"fields[list]":{"type":"array","items":{"type":"string","enum":["created","id","name","opt_in_process","updated"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sparse-fieldsets"},"fields[profile]":{"type":"array","items":{"type":"string","enum":["created","email","external_id","first_name","id","image","last_event_date","last_name","locale","location","location.address1","location.address2","location.city","location.country","location.ip","location.latitude","location.longitude","location.region","location.timezone","location.zip","organization","phone_number","predictive_analytics","predictive_analytics.average_days_between_orders","predictive_analytics.average_order_value","predictive_analytics.churn_probability","predictive_analytics.expected_date_of_next_order","predictive_analytics.historic_clv","predictive_analytics.historic_number_of_orders","predictive_analytics.predicted_clv","predictive_analytics.predicted_number_of_orders","predictive_analytics.ranked_channel_affinity","predictive_analytics.total_clv","properties","subscriptions","subscriptions.email","subscriptions.email.marketing","subscriptions.email.marketing.can_receive_email_marketing","subscriptions.email.marketing.consent","subscriptions.email.marketing.consent_timestamp","subscriptions.email.marketing.custom_method_detail","subscriptions.email.marketing.double_optin","subscriptions.email.marketing.last_updated","subscriptions.email.marketing.list_suppressions","subscriptions.email.marketing.method","subscriptions.email.marketing.method_detail","subscriptions.email.marketing.suppression","subscriptions.mobile_push","subscriptions.mobile_push.marketing","subscriptions.mobile_push.marketing.can_receive_push_marketing","subscriptions.mobile_push.marketing.consent","subscriptions.mobile_push.marketing.consent_timestamp","subscriptions.sms","subscriptions.sms.marketing","subscriptions.sms.marketing.can_receive_sms_marketing","subscriptions.sms.marketing.consent","subscriptions.sms.marketing.consent_timestamp","subscriptions.sms.marketing.last_updated","subscriptions.sms.marketing.method","subscriptions.sms.marketing.method_detail","subscriptions.sms.transactional","subscriptions.sms.transactional.can_receive_sms_transactional","subscriptions.sms.transactional.consent","subscriptions.sms.transactional.consent_timestamp","subscriptions.sms.transactional.last_updated","subscriptions.sms.transactional.method","subscriptions.sms.transactional.method_detail","subscriptions.whatsapp","subscriptions.whatsapp.conversational","subscriptions.whatsapp.conversational.can_receive","subscriptions.whatsapp.conversational.consent","subscriptions.whatsapp.conversational.consent_timestamp","subscriptions.whatsapp.conversational.created_timestamp","subscriptions.whatsapp.conversational.last_updated","subscriptions.whatsapp.conversational.metadata","subscriptions.whatsapp.conversational.phone_number","subscriptions.whatsapp.conversational.valid_until","subscriptions.whatsapp.marketing","subscriptions.whatsapp.marketing.can_receive","subscriptions.whatsapp.marketing.consent","subscriptions.whatsapp.marketing.consent_timestamp","subscriptions.whatsapp.marketing.created_timestamp","subscriptions.whatsapp.marketing.last_updated","subscriptions.whatsapp.marketing.metadata","subscriptions.whatsapp.marketing.phone_number","subscriptions.whatsapp.marketing.valid_until","subscriptions.whatsapp.transactional","subscriptions.whatsapp.transactional.can_receive","subscriptions.whatsapp.transactional.consent","subscriptions.whatsapp.transactional.consent_timestamp","subscriptions.whatsapp.transactional.created_timestamp","subscriptions.whatsapp.transactional.last_updated","subscriptions.whatsapp.transactional.metadata","subscriptions.whatsapp.transactional.phone_number","subscriptions.whatsapp.transactional.valid_until","title","updated"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sparse-fieldsets"},"fields[push-token]":{"type":"array","items":{"type":"string","enum":["background","created","enablement_status","id","metadata","metadata.app_build","metadata.app_id","metadata.app_name","metadata.app_version","metadata.device_id","metadata.device_model","metadata.environment","metadata.klaviyo_sdk","metadata.manufacturer","metadata.os_name","metadata.os_version","metadata.sdk_version","platform","recorded_date","token","vendor"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sparse-fieldsets"},"fields[segment]":{"type":"array","items":{"type":"string","enum":["created","definition","definition.condition_groups","id","is_active","is_processing","is_starred","name","updated"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sparse-fieldsets"},"include":{"type":"array","items":{"type":"string","enum":["conversation","lists","push-tokens","segments"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#relationships"},"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"}},"required":["id","revision"]},
    method: "get",
    pathTemplate: "/api/profiles/{id}",
    executionParameters: [{"name":"id","in":"path"},{"name":"additional-fields[profile]","in":"query"},{"name":"fields[conversation]","in":"query"},{"name":"fields[list]","in":"query"},{"name":"fields[profile]","in":"query"},{"name":"fields[push-token]","in":"query"},{"name":"fields[segment]","in":"query"},{"name":"include","in":"query"},{"name":"revision","in":"header"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Profiles"],
    deprecated: false
  }],
  ["update_profile", {
    name: "update_profile",
    description: `Update the profile with the given profile ID.

Use the \`additional-fields\` parameter to include subscriptions and predictive analytics data in your response.

Note that setting a field to \`null\` will clear out the field, whereas not including a field in your request will leave it unchanged.

The maximum allowed payload size is 100KB.<br><br>*Rate limits*:<br>Burst: \`75/s\`<br>Steady: \`750/m\`

**Scopes:**
\`profiles:write\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/update_profile.json)
(Tags: Profiles)`,
    inputSchema: {"type":"object","properties":{"id":{"description":"Primary key that uniquely identifies this profile. Generated by Klaviyo.","type":"string"},"additional-fields[profile]":{"type":"array","items":{"type":"string","enum":["subscriptions","predictive_analytics"]},"description":"Request additional fields not included by default in the response. Supported values: 'subscriptions', 'predictive_analytics'"},"fields[profile]":{"type":"array","items":{"type":"string","enum":["created","email","external_id","first_name","id","image","last_event_date","last_name","locale","location","location.address1","location.address2","location.city","location.country","location.ip","location.latitude","location.longitude","location.region","location.timezone","location.zip","organization","phone_number","predictive_analytics","predictive_analytics.average_days_between_orders","predictive_analytics.average_order_value","predictive_analytics.churn_probability","predictive_analytics.expected_date_of_next_order","predictive_analytics.historic_clv","predictive_analytics.historic_number_of_orders","predictive_analytics.predicted_clv","predictive_analytics.predicted_number_of_orders","predictive_analytics.ranked_channel_affinity","predictive_analytics.total_clv","properties","subscriptions","subscriptions.email","subscriptions.email.marketing","subscriptions.email.marketing.can_receive_email_marketing","subscriptions.email.marketing.consent","subscriptions.email.marketing.consent_timestamp","subscriptions.email.marketing.custom_method_detail","subscriptions.email.marketing.double_optin","subscriptions.email.marketing.last_updated","subscriptions.email.marketing.list_suppressions","subscriptions.email.marketing.method","subscriptions.email.marketing.method_detail","subscriptions.email.marketing.suppression","subscriptions.mobile_push","subscriptions.mobile_push.marketing","subscriptions.mobile_push.marketing.can_receive_push_marketing","subscriptions.mobile_push.marketing.consent","subscriptions.mobile_push.marketing.consent_timestamp","subscriptions.sms","subscriptions.sms.marketing","subscriptions.sms.marketing.can_receive_sms_marketing","subscriptions.sms.marketing.consent","subscriptions.sms.marketing.consent_timestamp","subscriptions.sms.marketing.last_updated","subscriptions.sms.marketing.method","subscriptions.sms.marketing.method_detail","subscriptions.sms.transactional","subscriptions.sms.transactional.can_receive_sms_transactional","subscriptions.sms.transactional.consent","subscriptions.sms.transactional.consent_timestamp","subscriptions.sms.transactional.last_updated","subscriptions.sms.transactional.method","subscriptions.sms.transactional.method_detail","subscriptions.whatsapp","subscriptions.whatsapp.conversational","subscriptions.whatsapp.conversational.can_receive","subscriptions.whatsapp.conversational.consent","subscriptions.whatsapp.conversational.consent_timestamp","subscriptions.whatsapp.conversational.created_timestamp","subscriptions.whatsapp.conversational.last_updated","subscriptions.whatsapp.conversational.metadata","subscriptions.whatsapp.conversational.phone_number","subscriptions.whatsapp.conversational.valid_until","subscriptions.whatsapp.marketing","subscriptions.whatsapp.marketing.can_receive","subscriptions.whatsapp.marketing.consent","subscriptions.whatsapp.marketing.consent_timestamp","subscriptions.whatsapp.marketing.created_timestamp","subscriptions.whatsapp.marketing.last_updated","subscriptions.whatsapp.marketing.metadata","subscriptions.whatsapp.marketing.phone_number","subscriptions.whatsapp.marketing.valid_until","subscriptions.whatsapp.transactional","subscriptions.whatsapp.transactional.can_receive","subscriptions.whatsapp.transactional.consent","subscriptions.whatsapp.transactional.consent_timestamp","subscriptions.whatsapp.transactional.created_timestamp","subscriptions.whatsapp.transactional.last_updated","subscriptions.whatsapp.transactional.metadata","subscriptions.whatsapp.transactional.phone_number","subscriptions.whatsapp.transactional.valid_until","title","updated"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sparse-fieldsets"},"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"},"requestBody":{"type":"string","description":"Request body (content type: application/vnd.api+json)"}},"required":["id","revision","requestBody"]},
    method: "patch",
    pathTemplate: "/api/profiles/{id}",
    executionParameters: [{"name":"id","in":"path"},{"name":"additional-fields[profile]","in":"query"},{"name":"fields[profile]","in":"query"},{"name":"revision","in":"header"}],
    requestBodyContentType: "application/vnd.api+json",
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Profiles"],
    deprecated: false
  }],
  ["get_bulk_import_profiles_jobs", {
    name: "get_bulk_import_profiles_jobs",
    description: `Get all bulk profile import jobs.

Returns a maximum of 100 jobs per request.<br><br>*Rate limits*:<br>Burst: \`10/s\`<br>Steady: \`150/m\`

**Scopes:**
\`lists:read\`
\`profiles:read\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/get_bulk_import_profiles_jobs.json)
(Tags: Profiles)`,
    inputSchema: {"type":"object","properties":{"fields[profile-bulk-import-job]":{"type":"array","items":{"type":"string","enum":["completed_at","completed_count","created_at","expires_at","failed_count","id","started_at","status","total_count"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sparse-fieldsets"},"filter":{"type":"string","description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#filtering<br>Allowed field(s)/operator(s):<br>`status`: `any`, `equals`"},"page[cursor]":{"type":"string","description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#pagination"},"page[size]":{"type":"number","default":20,"maximum":100,"minimum":1,"description":"Default: 20. Min: 1. Max: 100."},"sort":{"type":"string","enum":["created_at","-created_at"],"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sorting"},"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"}},"required":["revision"]},
    method: "get",
    pathTemplate: "/api/profile-bulk-import-jobs",
    executionParameters: [{"name":"fields[profile-bulk-import-job]","in":"query"},{"name":"filter","in":"query"},{"name":"page[cursor]","in":"query"},{"name":"page[size]","in":"query"},{"name":"sort","in":"query"},{"name":"revision","in":"header"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Profiles"],
    deprecated: false
  }],
  ["bulk_import_profiles", {
    name: "bulk_import_profiles",
    description: `Create a bulk profile import job to create or update a batch of profiles.

Accepts up to 10,000 profiles per request. The maximum allowed payload size is 5MB. The maximum allowed payload size per-profile is 100KB.

To learn more, see our [Bulk Profile Import API guide](https://developers.klaviyo.com/en/docs/use_klaviyos_bulk_profile_import_api).<br><br>*Rate limits*:<br>Burst: \`10/s\`<br>Steady: \`150/m\`

**Scopes:**
\`lists:write\`
\`profiles:write\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/bulk_import_profiles.json)
(Tags: Profiles)`,
    inputSchema: {"type":"object","properties":{"fields[profile-bulk-import-job]":{"type":"array","items":{"type":"string","enum":["completed_at","completed_count","created_at","expires_at","failed_count","id","started_at","status","total_count"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sparse-fieldsets"},"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"},"requestBody":{"type":"string","description":"Request body (content type: application/vnd.api+json)"}},"required":["revision","requestBody"]},
    method: "post",
    pathTemplate: "/api/profile-bulk-import-jobs",
    executionParameters: [{"name":"fields[profile-bulk-import-job]","in":"query"},{"name":"revision","in":"header"}],
    requestBodyContentType: "application/vnd.api+json",
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Profiles"],
    deprecated: false
  }],
  ["get_bulk_import_profiles_job", {
    name: "get_bulk_import_profiles_job",
    description: `Get a bulk profile import job with the given job ID.<br><br>*Rate limits*:<br>Burst: \`10/s\`<br>Steady: \`150/m\`

**Scopes:**
\`lists:read\`
\`profiles:read\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/get_bulk_import_profiles_job.json)
(Tags: Profiles)`,
    inputSchema: {"type":"object","properties":{"job_id":{"description":"ID of the job to retrieve.","type":"string"},"fields[list]":{"type":"array","items":{"type":"string","enum":["created","id","name","opt_in_process","updated"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sparse-fieldsets"},"fields[profile-bulk-import-job]":{"type":"array","items":{"type":"string","enum":["completed_at","completed_count","created_at","expires_at","failed_count","id","started_at","status","total_count"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sparse-fieldsets"},"include":{"type":"array","items":{"type":"string","enum":["lists"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#relationships"},"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"}},"required":["job_id","revision"]},
    method: "get",
    pathTemplate: "/api/profile-bulk-import-jobs/{job_id}",
    executionParameters: [{"name":"job_id","in":"path"},{"name":"fields[list]","in":"query"},{"name":"fields[profile-bulk-import-job]","in":"query"},{"name":"include","in":"query"},{"name":"revision","in":"header"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Profiles"],
    deprecated: false
  }],
  ["get_bulk_suppress_profiles_jobs", {
    name: "get_bulk_suppress_profiles_jobs",
    description: `Get the status of all bulk profile suppression jobs.<br><br>*Rate limits*:<br>Burst: \`75/s\`<br>Steady: \`750/m\`

**Scopes:**
\`subscriptions:read\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/get_bulk_suppress_profiles_jobs.json)
(Tags: Profiles)`,
    inputSchema: {"type":"object","properties":{"fields[profile-suppression-bulk-create-job]":{"type":"array","items":{"type":"string","enum":["completed_at","completed_count","created_at","id","skipped_count","status","total_count"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sparse-fieldsets"},"filter":{"type":"string","description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#filtering<br>Allowed field(s)/operator(s):<br>`status`: `equals`<br>`list_id`: `equals`<br>`segment_id`: `equals`"},"page[cursor]":{"type":"string","description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#pagination"},"sort":{"type":"string","enum":["created","-created"],"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sorting"},"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"}},"required":["revision"]},
    method: "get",
    pathTemplate: "/api/profile-suppression-bulk-create-jobs",
    executionParameters: [{"name":"fields[profile-suppression-bulk-create-job]","in":"query"},{"name":"filter","in":"query"},{"name":"page[cursor]","in":"query"},{"name":"sort","in":"query"},{"name":"revision","in":"header"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Profiles"],
    deprecated: false
  }],
  ["bulk_suppress_profiles", {
    name: "bulk_suppress_profiles",
    description: `Manually suppress profiles by email address or specify a segment/list ID to suppress all current members of a segment/list.

Suppressed profiles cannot receive email marketing, independent of their consent status. To learn more, see our guides on [email suppressions](https://help.klaviyo.com/hc/en-us/articles/115005246108#what-is-a-suppressed-profile-1) and [collecting consent](https://developers.klaviyo.com/en/docs/collect_email_and_sms_consent_via_api).

Email address per request limit: 100<br><br>*Rate limits*:<br>Burst: \`75/s\`<br>Steady: \`750/m\`

**Scopes:**
\`profiles:write\`
\`subscriptions:write\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/bulk_suppress_profiles.json)
(Tags: Profiles)`,
    inputSchema: {"type":"object","properties":{"fields[profile-suppression-bulk-create-job]":{"type":"array","items":{"type":"string","enum":["completed_at","completed_count","created_at","id","skipped_count","status","total_count"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sparse-fieldsets"},"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"},"requestBody":{"type":"string","description":"Suppresses one or more profiles from receiving marketing. Currently, supports email only. If a profile is not found with the given email, one will be created and immediately suppressed."}},"required":["revision","requestBody"]},
    method: "post",
    pathTemplate: "/api/profile-suppression-bulk-create-jobs",
    executionParameters: [{"name":"fields[profile-suppression-bulk-create-job]","in":"query"},{"name":"revision","in":"header"}],
    requestBodyContentType: "application/vnd.api+json",
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Profiles"],
    deprecated: false
  }],
  ["get_bulk_suppress_profiles_job", {
    name: "get_bulk_suppress_profiles_job",
    description: `Get the bulk suppress profiles job with the given job ID.<br><br>*Rate limits*:<br>Burst: \`75/s\`<br>Steady: \`750/m\`

**Scopes:**
\`subscriptions:read\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/get_bulk_suppress_profiles_job.json)
(Tags: Profiles)`,
    inputSchema: {"type":"object","properties":{"job_id":{"description":"ID of the job to retrieve.","type":"string"},"fields[profile-suppression-bulk-create-job]":{"type":"array","items":{"type":"string","enum":["completed_at","completed_count","created_at","id","skipped_count","status","total_count"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sparse-fieldsets"},"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"}},"required":["job_id","revision"]},
    method: "get",
    pathTemplate: "/api/profile-suppression-bulk-create-jobs/{job_id}",
    executionParameters: [{"name":"job_id","in":"path"},{"name":"fields[profile-suppression-bulk-create-job]","in":"query"},{"name":"revision","in":"header"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Profiles"],
    deprecated: false
  }],
  ["get_bulk_unsuppress_profiles_jobs", {
    name: "get_bulk_unsuppress_profiles_jobs",
    description: `Get all bulk unsuppress profiles jobs.<br><br>*Rate limits*:<br>Burst: \`75/s\`<br>Steady: \`750/m\`

**Scopes:**
\`subscriptions:read\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/get_bulk_unsuppress_profiles_jobs.json)
(Tags: Profiles)`,
    inputSchema: {"type":"object","properties":{"fields[profile-suppression-bulk-delete-job]":{"type":"array","items":{"type":"string","enum":["completed_at","completed_count","created_at","id","skipped_count","status","total_count"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sparse-fieldsets"},"filter":{"type":"string","description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#filtering<br>Allowed field(s)/operator(s):<br>`status`: `equals`<br>`list_id`: `equals`<br>`segment_id`: `equals`"},"page[cursor]":{"type":"string","description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#pagination"},"sort":{"type":"string","enum":["created","-created"],"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sorting"},"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"}},"required":["revision"]},
    method: "get",
    pathTemplate: "/api/profile-suppression-bulk-delete-jobs",
    executionParameters: [{"name":"fields[profile-suppression-bulk-delete-job]","in":"query"},{"name":"filter","in":"query"},{"name":"page[cursor]","in":"query"},{"name":"sort","in":"query"},{"name":"revision","in":"header"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Profiles"],
    deprecated: false
  }],
  ["bulk_unsuppress_profiles", {
    name: "bulk_unsuppress_profiles",
    description: `Manually unsuppress profiles by email address or specify a segment/list ID to unsuppress all current members of a segment/list.

This only removes suppressions with reason USER_SUPPRESSED ; unsubscribed profiles and suppressed profiles with reason INVALID_EMAIL or HARD_BOUNCE remain unchanged. To learn more, see our guides on [email suppressions](https://help.klaviyo.com/hc/en-us/articles/115005246108#what-is-a-suppressed-profile-1) and [collecting consent](https://developers.klaviyo.com/en/docs/collect_email_and_sms_consent_via_api).

Email address per request limit: 100<br><br>*Rate limits*:<br>Burst: \`75/s\`<br>Steady: \`750/m\`

**Scopes:**
\`subscriptions:write\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/bulk_unsuppress_profiles.json)
(Tags: Profiles)`,
    inputSchema: {"type":"object","properties":{"fields[profile-suppression-bulk-delete-job]":{"type":"array","items":{"type":"string","enum":["completed_at","completed_count","created_at","id","skipped_count","status","total_count"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sparse-fieldsets"},"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"},"requestBody":{"type":"string","description":"Unsuppresses one or more profiles from receiving marketing. Currently, supports email only. If a profile is not\nfound with the given email, no action will be taken."}},"required":["revision","requestBody"]},
    method: "post",
    pathTemplate: "/api/profile-suppression-bulk-delete-jobs",
    executionParameters: [{"name":"fields[profile-suppression-bulk-delete-job]","in":"query"},{"name":"revision","in":"header"}],
    requestBodyContentType: "application/vnd.api+json",
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Profiles"],
    deprecated: false
  }],
  ["get_bulk_unsuppress_profiles_job", {
    name: "get_bulk_unsuppress_profiles_job",
    description: `Get the bulk unsuppress profiles job with the given job ID.<br><br>*Rate limits*:<br>Burst: \`75/s\`<br>Steady: \`750/m\`

**Scopes:**
\`subscriptions:read\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/get_bulk_unsuppress_profiles_job.json)
(Tags: Profiles)`,
    inputSchema: {"type":"object","properties":{"job_id":{"description":"ID of the job to retrieve.","type":"string"},"fields[profile-suppression-bulk-delete-job]":{"type":"array","items":{"type":"string","enum":["completed_at","completed_count","created_at","id","skipped_count","status","total_count"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sparse-fieldsets"},"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"}},"required":["job_id","revision"]},
    method: "get",
    pathTemplate: "/api/profile-suppression-bulk-delete-jobs/{job_id}",
    executionParameters: [{"name":"job_id","in":"path"},{"name":"fields[profile-suppression-bulk-delete-job]","in":"query"},{"name":"revision","in":"header"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Profiles"],
    deprecated: false
  }],
  ["get_push_tokens", {
    name: "get_push_tokens",
    description: `Return push tokens associated with company.<br><br>*Rate limits*:<br>Burst: \`10/s\`<br>Steady: \`150/m\`

**Scopes:**
\`profiles:read\`
\`push-tokens:read\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/get_push_tokens.json)
(Tags: Profiles)`,
    inputSchema: {"type":"object","properties":{"fields[profile]":{"type":"array","items":{"type":"string","enum":["created","email","external_id","first_name","id","image","last_event_date","last_name","locale","location","location.address1","location.address2","location.city","location.country","location.ip","location.latitude","location.longitude","location.region","location.timezone","location.zip","organization","phone_number","properties","title","updated"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sparse-fieldsets"},"fields[push-token]":{"type":"array","items":{"type":"string","enum":["background","created","enablement_status","id","metadata","metadata.app_build","metadata.app_id","metadata.app_name","metadata.app_version","metadata.device_id","metadata.device_model","metadata.environment","metadata.klaviyo_sdk","metadata.manufacturer","metadata.os_name","metadata.os_version","metadata.sdk_version","platform","recorded_date","token","vendor"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sparse-fieldsets"},"filter":{"type":"string","description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#filtering<br>Allowed field(s)/operator(s):<br>`id`: `equals`<br>`profile.id`: `equals`<br>`enablement_status`: `equals`<br>`platform`: `equals`"},"include":{"type":"array","items":{"type":"string","enum":["profile"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#relationships"},"page[cursor]":{"type":"string","description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#pagination"},"page[size]":{"type":"number","default":20,"maximum":100,"minimum":1,"description":"Default: 20. Min: 1. Max: 100."},"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"}},"required":["revision"]},
    method: "get",
    pathTemplate: "/api/push-tokens",
    executionParameters: [{"name":"fields[profile]","in":"query"},{"name":"fields[push-token]","in":"query"},{"name":"filter","in":"query"},{"name":"include","in":"query"},{"name":"page[cursor]","in":"query"},{"name":"page[size]","in":"query"},{"name":"revision","in":"header"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Profiles"],
    deprecated: false
  }],
  ["create_push_token", {
    name: "create_push_token",
    description: `Create or update a push token.

This endpoint can be used to migrate push tokens from another platform to Klaviyo. Please use our mobile SDKs ([iOS](https://github.com/klaviyo/klaviyo-swift-sdk) and [Android](https://github.com/klaviyo/klaviyo-android-sdk)) to create push tokens from users' devices.

The maximum allowed payload size is 100KB.<br><br>*Rate limits*:<br>Burst: \`75/s\`<br>Steady: \`750/m\`

**Scopes:**
\`profiles:write\`
\`push-tokens:write\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/create_push_token.json)
(Tags: Profiles)`,
    inputSchema: {"type":"object","properties":{"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"},"requestBody":{"type":"string","description":"Request body (content type: application/vnd.api+json)"}},"required":["revision","requestBody"]},
    method: "post",
    pathTemplate: "/api/push-tokens",
    executionParameters: [{"name":"revision","in":"header"}],
    requestBodyContentType: "application/vnd.api+json",
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Profiles"],
    deprecated: false
  }],
  ["get_push_token", {
    name: "get_push_token",
    description: `Return a specific push token based on its ID.<br><br>*Rate limits*:<br>Burst: \`10/s\`<br>Steady: \`150/m\`

**Scopes:**
\`profiles:read\`
\`push-tokens:read\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/get_push_token.json)
(Tags: Profiles)`,
    inputSchema: {"type":"object","properties":{"id":{"description":"The value of the push token","type":"string"},"fields[profile]":{"type":"array","items":{"type":"string","enum":["created","email","external_id","first_name","id","image","last_event_date","last_name","locale","location","location.address1","location.address2","location.city","location.country","location.ip","location.latitude","location.longitude","location.region","location.timezone","location.zip","organization","phone_number","properties","title","updated"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sparse-fieldsets"},"fields[push-token]":{"type":"array","items":{"type":"string","enum":["background","created","enablement_status","id","metadata","metadata.app_build","metadata.app_id","metadata.app_name","metadata.app_version","metadata.device_id","metadata.device_model","metadata.environment","metadata.klaviyo_sdk","metadata.manufacturer","metadata.os_name","metadata.os_version","metadata.sdk_version","platform","recorded_date","token","vendor"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sparse-fieldsets"},"include":{"type":"array","items":{"type":"string","enum":["profile"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#relationships"},"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"}},"required":["id","revision"]},
    method: "get",
    pathTemplate: "/api/push-tokens/{id}",
    executionParameters: [{"name":"id","in":"path"},{"name":"fields[profile]","in":"query"},{"name":"fields[push-token]","in":"query"},{"name":"include","in":"query"},{"name":"revision","in":"header"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Profiles"],
    deprecated: false
  }],
  ["delete_push_token", {
    name: "delete_push_token",
    description: `Delete a specific push token based on its ID.<br><br>*Rate limits*:<br>Burst: \`3/s\`<br>Steady: \`60/m\`

**Scopes:**
\`push-tokens:write\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/delete_push_token.json)
(Tags: Profiles)`,
    inputSchema: {"type":"object","properties":{"id":{"description":"The value of the push token to delete","type":"string"},"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"}},"required":["id","revision"]},
    method: "delete",
    pathTemplate: "/api/push-tokens/{id}",
    executionParameters: [{"name":"id","in":"path"},{"name":"revision","in":"header"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Profiles"],
    deprecated: false
  }],
  ["create_or_update_profile", {
    name: "create_or_update_profile",
    description: `Given a set of profile attributes and optionally an ID, create or update a profile.

Returns 201 if a new profile was created, 200 if an existing profile was updated.

Use the \`additional-fields\` parameter to include subscriptions and predictive analytics data in your response.

Note that setting a field to \`null\` will clear out the field, whereas not including a field in your request will leave it unchanged.

The maximum allowed payload size is 100KB.<br><br>*Rate limits*:<br>Burst: \`75/s\`<br>Steady: \`750/m\`

**Scopes:**
\`profiles:write\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/create_or_update_profile.json)
(Tags: Profiles)`,
    inputSchema: {"type":"object","properties":{"additional-fields[profile]":{"type":"array","items":{"type":"string","enum":["subscriptions","predictive_analytics"]},"description":"Request additional fields not included by default in the response. Supported values: 'subscriptions', 'predictive_analytics'"},"fields[profile]":{"type":"array","items":{"type":"string","enum":["created","email","external_id","first_name","id","image","last_event_date","last_name","locale","location","location.address1","location.address2","location.city","location.country","location.ip","location.latitude","location.longitude","location.region","location.timezone","location.zip","organization","phone_number","predictive_analytics","predictive_analytics.average_days_between_orders","predictive_analytics.average_order_value","predictive_analytics.churn_probability","predictive_analytics.expected_date_of_next_order","predictive_analytics.historic_clv","predictive_analytics.historic_number_of_orders","predictive_analytics.predicted_clv","predictive_analytics.predicted_number_of_orders","predictive_analytics.ranked_channel_affinity","predictive_analytics.total_clv","properties","subscriptions","subscriptions.email","subscriptions.email.marketing","subscriptions.email.marketing.can_receive_email_marketing","subscriptions.email.marketing.consent","subscriptions.email.marketing.consent_timestamp","subscriptions.email.marketing.custom_method_detail","subscriptions.email.marketing.double_optin","subscriptions.email.marketing.last_updated","subscriptions.email.marketing.list_suppressions","subscriptions.email.marketing.method","subscriptions.email.marketing.method_detail","subscriptions.email.marketing.suppression","subscriptions.mobile_push","subscriptions.mobile_push.marketing","subscriptions.mobile_push.marketing.can_receive_push_marketing","subscriptions.mobile_push.marketing.consent","subscriptions.mobile_push.marketing.consent_timestamp","subscriptions.sms","subscriptions.sms.marketing","subscriptions.sms.marketing.can_receive_sms_marketing","subscriptions.sms.marketing.consent","subscriptions.sms.marketing.consent_timestamp","subscriptions.sms.marketing.last_updated","subscriptions.sms.marketing.method","subscriptions.sms.marketing.method_detail","subscriptions.sms.transactional","subscriptions.sms.transactional.can_receive_sms_transactional","subscriptions.sms.transactional.consent","subscriptions.sms.transactional.consent_timestamp","subscriptions.sms.transactional.last_updated","subscriptions.sms.transactional.method","subscriptions.sms.transactional.method_detail","subscriptions.whatsapp","subscriptions.whatsapp.conversational","subscriptions.whatsapp.conversational.can_receive","subscriptions.whatsapp.conversational.consent","subscriptions.whatsapp.conversational.consent_timestamp","subscriptions.whatsapp.conversational.created_timestamp","subscriptions.whatsapp.conversational.last_updated","subscriptions.whatsapp.conversational.metadata","subscriptions.whatsapp.conversational.phone_number","subscriptions.whatsapp.conversational.valid_until","subscriptions.whatsapp.marketing","subscriptions.whatsapp.marketing.can_receive","subscriptions.whatsapp.marketing.consent","subscriptions.whatsapp.marketing.consent_timestamp","subscriptions.whatsapp.marketing.created_timestamp","subscriptions.whatsapp.marketing.last_updated","subscriptions.whatsapp.marketing.metadata","subscriptions.whatsapp.marketing.phone_number","subscriptions.whatsapp.marketing.valid_until","subscriptions.whatsapp.transactional","subscriptions.whatsapp.transactional.can_receive","subscriptions.whatsapp.transactional.consent","subscriptions.whatsapp.transactional.consent_timestamp","subscriptions.whatsapp.transactional.created_timestamp","subscriptions.whatsapp.transactional.last_updated","subscriptions.whatsapp.transactional.metadata","subscriptions.whatsapp.transactional.phone_number","subscriptions.whatsapp.transactional.valid_until","title","updated"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sparse-fieldsets"},"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"},"requestBody":{"type":"string","description":"Request body (content type: application/vnd.api+json)"}},"required":["revision","requestBody"]},
    method: "post",
    pathTemplate: "/api/profile-import",
    executionParameters: [{"name":"additional-fields[profile]","in":"query"},{"name":"fields[profile]","in":"query"},{"name":"revision","in":"header"}],
    requestBodyContentType: "application/vnd.api+json",
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Profiles"],
    deprecated: false
  }],
  ["merge_profiles", {
    name: "merge_profiles",
    description: `Merge a given related profile into a profile with the given profile ID.

The profile provided under \`relationships\` (the "source" profile) will be merged into the profile provided by the ID in the base data object (the "destination" profile).
This endpoint queues an asynchronous task which will merge data from the source profile into the destination profile, deleting the source profile in the process. This endpoint accepts only one source profile.

To learn more about how profile data is preserved or overwritten during a merge, please [visit our Help Center](https://help.klaviyo.com/hc/en-us/articles/115005073847#merge-2-profiles3).<br><br>*Rate limits*:<br>Burst: \`10/s\`<br>Steady: \`150/m\`

**Scopes:**
\`profiles:write\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/merge_profiles.json)
(Tags: Profiles)`,
    inputSchema: {"type":"object","properties":{"fields[profile]":{"type":"array","items":{"type":"string","enum":["id"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sparse-fieldsets"},"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"},"requestBody":{"type":"string","description":"Request body (content type: application/vnd.api+json)"}},"required":["revision","requestBody"]},
    method: "post",
    pathTemplate: "/api/profile-merge",
    executionParameters: [{"name":"fields[profile]","in":"query"},{"name":"revision","in":"header"}],
    requestBodyContentType: "application/vnd.api+json",
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Profiles"],
    deprecated: false
  }],
  ["bulk_subscribe_profiles", {
    name: "bulk_subscribe_profiles",
    description: `Subscribe one or more profiles to email marketing, SMS marketing, WhatsApp, or push. If the provided list has double opt-in enabled, profiles will receive a message requiring their confirmation before subscribing. Otherwise, profiles will be immediately subscribed without receiving a confirmation message.
Learn more about [consent in this guide](https://developers.klaviyo.com/en/docs/collect_email_and_sms_consent_via_api).

If a list is not provided, the opt-in process used will be determined by the [account-level default opt-in setting](https://www.klaviyo.com/settings/account/api-keys).

To add someone to a list without changing their subscription status, use [Add Profile to List](https://developers.klaviyo.com/en/reference/create_list_relationships).

This API will remove any \`UNSUBSCRIBE\`, \`SPAM_REPORT\` or \`USER_SUPPRESSED\` suppressions from the provided profiles. Learn more about [suppressed profiles](https://help.klaviyo.com/hc/en-us/articles/115005246108-Understanding-suppressed-email-profiles#what-is-a-suppressed-profile-1).

Maximum number of profiles can be submitted for subscription: 1000

This endpoint now supports a \`historical_import\` flag. If this flag is set \`true\`, profiles being subscribed will bypass double opt-in emails and be subscribed immediately. They will also bypass any associated "Added to list" flows. This is useful for importing historical data where you have already collected consent. If \`historical_import\` is set to true, the \`consented_at\` field is required and must be in the past.

Push tokens provided in \`push_tokens\` will be registered for each profile as long as push subscriptions are consented to.<br><br>*Rate limits*:<br>Burst: \`75/s\`<br>Steady: \`750/m\`

**Scopes:**
\`lists:write\`
\`profiles:write\`
\`subscriptions:write\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/bulk_subscribe_profiles.json)
(Tags: Profiles)`,
    inputSchema: {"type":"object","properties":{"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"},"requestBody":{"type":"string","description":"Subscribes one or more profiles to marketing, with support for push channel and push tokens.\nAll profiles will be added to the provided list. Either email or phone number is required.\nBoth may be specified to subscribe to both channels. If a profile cannot be found matching\nthe given identifier(s), a new profile will be created and then subscribed."}},"required":["revision","requestBody"]},
    method: "post",
    pathTemplate: "/api/profile-subscription-bulk-create-jobs",
    executionParameters: [{"name":"revision","in":"header"}],
    requestBodyContentType: "application/vnd.api+json",
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Profiles"],
    deprecated: false
  }],
  ["bulk_unsubscribe_profiles", {
    name: "bulk_unsubscribe_profiles",
    description: `> 🚧
>
> Profiles not in the specified list will be globally unsubscribed. Always verify profile list membership before calling this endpoint to avoid unintended global unsubscribes.

Unsubscribe one or more profiles from email marketing, SMS marketing, push marketing, or a combination. Learn more about [consent in this guide](https://developers.klaviyo.com/en/docs/collect_email_and_sms_consent_via_api).

Push tokens provided in \`subscriptions.push.tokens\` will be removed for the specified profiles.

To remove someone from a list without changing their subscription status, use [Remove Profiles from List](https://developers.klaviyo.com/en/reference/remove_profiles_from_list).

Maximum number of profiles per call: 100<br><br>*Rate limits*:<br>Burst: \`75/s\`<br>Steady: \`750/m\`

**Scopes:**
\`lists:write\`
\`profiles:write\`
\`subscriptions:write\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/bulk_unsubscribe_profiles.json)
(Tags: Profiles)`,
    inputSchema: {"type":"object","properties":{"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"},"requestBody":{"type":"string","description":"Unsubscribes one or more profiles from marketing. Supports email, SMS, WhatsApp, and push channels. All profiles will be removed from the provided list.\nEither email or phone number is required for email/SMS/WhatsApp channels. Push tokens can be removed by providing token strings directly.\nIf a profile cannot be found matching the given identifier(s), a new profile will be created and then unsubscribed."}},"required":["revision","requestBody"]},
    method: "post",
    pathTemplate: "/api/profile-subscription-bulk-delete-jobs",
    executionParameters: [{"name":"revision","in":"header"}],
    requestBodyContentType: "application/vnd.api+json",
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Profiles"],
    deprecated: false
  }],
  ["get_push_tokens_for_profile", {
    name: "get_push_tokens_for_profile",
    description: `Return all push tokens that belong to the given profile.<br><br>*Rate limits*:<br>Burst: \`10/s\`<br>Steady: \`150/m\`

**Scopes:**
\`profiles:read\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/get_push_tokens_for_profile.json)
(Tags: Profiles)`,
    inputSchema: {"type":"object","properties":{"id":{"type":"string"},"fields[push-token]":{"type":"array","items":{"type":"string","enum":["background","created","enablement_status","id","metadata","metadata.app_build","metadata.app_id","metadata.app_name","metadata.app_version","metadata.device_id","metadata.device_model","metadata.environment","metadata.klaviyo_sdk","metadata.manufacturer","metadata.os_name","metadata.os_version","metadata.sdk_version","platform","recorded_date","token","vendor"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sparse-fieldsets"},"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"}},"required":["id","revision"]},
    method: "get",
    pathTemplate: "/api/profiles/{id}/push-tokens",
    executionParameters: [{"name":"id","in":"path"},{"name":"fields[push-token]","in":"query"},{"name":"revision","in":"header"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Profiles"],
    deprecated: false
  }],
  ["get_push_token_ids_for_profile", {
    name: "get_push_token_ids_for_profile",
    description: `Return the IDs of all push tokens associated with the given profile.<br><br>*Rate limits*:<br>Burst: \`10/s\`<br>Steady: \`150/m\`

**Scopes:**
\`profiles:read\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/get_push_token_ids_for_profile.json)
(Tags: Profiles)`,
    inputSchema: {"type":"object","properties":{"id":{"type":"string"},"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"}},"required":["id","revision"]},
    method: "get",
    pathTemplate: "/api/profiles/{id}/relationships/push-tokens",
    executionParameters: [{"name":"id","in":"path"},{"name":"revision","in":"header"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Profiles"],
    deprecated: false
  }],
  ["get_lists_for_profile", {
    name: "get_lists_for_profile",
    description: `Get list memberships for a profile with the given profile ID.<br><br>*Rate limits*:<br>Burst: \`3/s\`<br>Steady: \`60/m\`

**Scopes:**
\`lists:read\`
\`profiles:read\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/get_lists_for_profile.json)
(Tags: Profiles)`,
    inputSchema: {"type":"object","properties":{"id":{"type":"string"},"fields[list]":{"type":"array","items":{"type":"string","enum":["created","id","name","opt_in_process","updated"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sparse-fieldsets"},"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"}},"required":["id","revision"]},
    method: "get",
    pathTemplate: "/api/profiles/{id}/lists",
    executionParameters: [{"name":"id","in":"path"},{"name":"fields[list]","in":"query"},{"name":"revision","in":"header"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Profiles"],
    deprecated: false
  }],
  ["get_list_ids_for_profile", {
    name: "get_list_ids_for_profile",
    description: `Get list memberships for a profile with the given profile ID.<br><br>*Rate limits*:<br>Burst: \`3/s\`<br>Steady: \`60/m\`

**Scopes:**
\`lists:read\`
\`profiles:read\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/get_list_ids_for_profile.json)
(Tags: Profiles)`,
    inputSchema: {"type":"object","properties":{"id":{"type":"string"},"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"}},"required":["id","revision"]},
    method: "get",
    pathTemplate: "/api/profiles/{id}/relationships/lists",
    executionParameters: [{"name":"id","in":"path"},{"name":"revision","in":"header"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Profiles"],
    deprecated: false
  }],
  ["get_segments_for_profile", {
    name: "get_segments_for_profile",
    description: `Get segment memberships for a profile with the given profile ID.<br><br>*Rate limits*:<br>Burst: \`3/s\`<br>Steady: \`60/m\`

**Scopes:**
\`profiles:read\`
\`segments:read\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/get_segments_for_profile.json)
(Tags: Profiles)`,
    inputSchema: {"type":"object","properties":{"id":{"type":"string"},"fields[segment]":{"type":"array","items":{"type":"string","enum":["created","definition","definition.condition_groups","id","is_active","is_processing","is_starred","name","updated"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sparse-fieldsets"},"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"}},"required":["id","revision"]},
    method: "get",
    pathTemplate: "/api/profiles/{id}/segments",
    executionParameters: [{"name":"id","in":"path"},{"name":"fields[segment]","in":"query"},{"name":"revision","in":"header"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Profiles"],
    deprecated: false
  }],
  ["get_segment_ids_for_profile", {
    name: "get_segment_ids_for_profile",
    description: `Get segment membership relationships for a profile with the given profile ID.<br><br>*Rate limits*:<br>Burst: \`3/s\`<br>Steady: \`60/m\`

**Scopes:**
\`profiles:read\`
\`segments:read\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/get_segment_ids_for_profile.json)
(Tags: Profiles)`,
    inputSchema: {"type":"object","properties":{"id":{"type":"string"},"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"}},"required":["id","revision"]},
    method: "get",
    pathTemplate: "/api/profiles/{id}/relationships/segments",
    executionParameters: [{"name":"id","in":"path"},{"name":"revision","in":"header"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Profiles"],
    deprecated: false
  }],
  ["get_conversation_for_profile", {
    name: "get_conversation_for_profile",
    description: `Get the conversation for a profile with the given profile ID.<br><br>*Rate limits*:<br>Burst: \`3/s\`<br>Steady: \`60/m\`

**Scopes:**
\`conversations:read\`
\`profiles:read\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/get_conversation_for_profile.json)
(Tags: Profiles)`,
    inputSchema: {"type":"object","properties":{"id":{"type":"string"},"fields[conversation]":{"type":"array","items":{"type":"string","enum":["id"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sparse-fieldsets"},"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"}},"required":["id","revision"]},
    method: "get",
    pathTemplate: "/api/profiles/{id}/conversation",
    executionParameters: [{"name":"id","in":"path"},{"name":"fields[conversation]","in":"query"},{"name":"revision","in":"header"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Profiles"],
    deprecated: false
  }],
  ["get_conversation_id_for_profile", {
    name: "get_conversation_id_for_profile",
    description: `Get the conversation relationship for a profile with the given profile ID.<br><br>*Rate limits*:<br>Burst: \`3/s\`<br>Steady: \`60/m\`

**Scopes:**
\`conversations:read\`
\`profiles:read\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/get_conversation_id_for_profile.json)
(Tags: Profiles)`,
    inputSchema: {"type":"object","properties":{"id":{"type":"string"},"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"}},"required":["id","revision"]},
    method: "get",
    pathTemplate: "/api/profiles/{id}/relationships/conversation",
    executionParameters: [{"name":"id","in":"path"},{"name":"revision","in":"header"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Profiles"],
    deprecated: false
  }],
  ["get_list_for_bulk_import_profiles_job", {
    name: "get_list_for_bulk_import_profiles_job",
    description: `Get list for the bulk profile import job with the given ID.<br><br>*Rate limits*:<br>Burst: \`10/s\`<br>Steady: \`150/m\`

**Scopes:**
\`lists:read\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/get_list_for_bulk_import_profiles_job.json)
(Tags: Profiles)`,
    inputSchema: {"type":"object","properties":{"id":{"type":"string"},"fields[list]":{"type":"array","items":{"type":"string","enum":["created","id","name","opt_in_process","updated"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sparse-fieldsets"},"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"}},"required":["id","revision"]},
    method: "get",
    pathTemplate: "/api/profile-bulk-import-jobs/{id}/lists",
    executionParameters: [{"name":"id","in":"path"},{"name":"fields[list]","in":"query"},{"name":"revision","in":"header"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Profiles"],
    deprecated: false
  }],
  ["get_list_ids_for_bulk_import_profiles_job", {
    name: "get_list_ids_for_bulk_import_profiles_job",
    description: `Get list relationship for the bulk profile import job with the given ID.<br><br>*Rate limits*:<br>Burst: \`10/s\`<br>Steady: \`150/m\`

**Scopes:**
\`lists:read\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/get_list_ids_for_bulk_import_profiles_job.json)
(Tags: Profiles)`,
    inputSchema: {"type":"object","properties":{"id":{"type":"string"},"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"}},"required":["id","revision"]},
    method: "get",
    pathTemplate: "/api/profile-bulk-import-jobs/{id}/relationships/lists",
    executionParameters: [{"name":"id","in":"path"},{"name":"revision","in":"header"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Profiles"],
    deprecated: false
  }],
  ["get_profiles_for_bulk_import_profiles_job", {
    name: "get_profiles_for_bulk_import_profiles_job",
    description: `Get profiles for the bulk profile import job with the given ID.<br><br>*Rate limits*:<br>Burst: \`10/s\`<br>Steady: \`150/m\`

**Scopes:**
\`profiles:read\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/get_profiles_for_bulk_import_profiles_job.json)
(Tags: Profiles)`,
    inputSchema: {"type":"object","properties":{"id":{"type":"string"},"additional-fields[profile]":{"type":"array","items":{"type":"string","enum":["subscriptions","predictive_analytics"]},"description":"Request additional fields not included by default in the response. Supported values: 'subscriptions', 'predictive_analytics'"},"fields[profile]":{"type":"array","items":{"type":"string","enum":["created","email","external_id","first_name","id","image","last_event_date","last_name","locale","location","location.address1","location.address2","location.city","location.country","location.ip","location.latitude","location.longitude","location.region","location.timezone","location.zip","organization","phone_number","predictive_analytics","predictive_analytics.average_days_between_orders","predictive_analytics.average_order_value","predictive_analytics.churn_probability","predictive_analytics.expected_date_of_next_order","predictive_analytics.historic_clv","predictive_analytics.historic_number_of_orders","predictive_analytics.predicted_clv","predictive_analytics.predicted_number_of_orders","predictive_analytics.ranked_channel_affinity","predictive_analytics.total_clv","properties","subscriptions","subscriptions.email","subscriptions.email.marketing","subscriptions.email.marketing.can_receive_email_marketing","subscriptions.email.marketing.consent","subscriptions.email.marketing.consent_timestamp","subscriptions.email.marketing.custom_method_detail","subscriptions.email.marketing.double_optin","subscriptions.email.marketing.last_updated","subscriptions.email.marketing.list_suppressions","subscriptions.email.marketing.method","subscriptions.email.marketing.method_detail","subscriptions.email.marketing.suppression","subscriptions.mobile_push","subscriptions.mobile_push.marketing","subscriptions.mobile_push.marketing.can_receive_push_marketing","subscriptions.mobile_push.marketing.consent","subscriptions.mobile_push.marketing.consent_timestamp","subscriptions.sms","subscriptions.sms.marketing","subscriptions.sms.marketing.can_receive_sms_marketing","subscriptions.sms.marketing.consent","subscriptions.sms.marketing.consent_timestamp","subscriptions.sms.marketing.last_updated","subscriptions.sms.marketing.method","subscriptions.sms.marketing.method_detail","subscriptions.sms.transactional","subscriptions.sms.transactional.can_receive_sms_transactional","subscriptions.sms.transactional.consent","subscriptions.sms.transactional.consent_timestamp","subscriptions.sms.transactional.last_updated","subscriptions.sms.transactional.method","subscriptions.sms.transactional.method_detail","subscriptions.whatsapp","subscriptions.whatsapp.conversational","subscriptions.whatsapp.conversational.can_receive","subscriptions.whatsapp.conversational.consent","subscriptions.whatsapp.conversational.consent_timestamp","subscriptions.whatsapp.conversational.created_timestamp","subscriptions.whatsapp.conversational.last_updated","subscriptions.whatsapp.conversational.metadata","subscriptions.whatsapp.conversational.phone_number","subscriptions.whatsapp.conversational.valid_until","subscriptions.whatsapp.marketing","subscriptions.whatsapp.marketing.can_receive","subscriptions.whatsapp.marketing.consent","subscriptions.whatsapp.marketing.consent_timestamp","subscriptions.whatsapp.marketing.created_timestamp","subscriptions.whatsapp.marketing.last_updated","subscriptions.whatsapp.marketing.metadata","subscriptions.whatsapp.marketing.phone_number","subscriptions.whatsapp.marketing.valid_until","subscriptions.whatsapp.transactional","subscriptions.whatsapp.transactional.can_receive","subscriptions.whatsapp.transactional.consent","subscriptions.whatsapp.transactional.consent_timestamp","subscriptions.whatsapp.transactional.created_timestamp","subscriptions.whatsapp.transactional.last_updated","subscriptions.whatsapp.transactional.metadata","subscriptions.whatsapp.transactional.phone_number","subscriptions.whatsapp.transactional.valid_until","title","updated"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sparse-fieldsets"},"page[cursor]":{"type":"string","description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#pagination"},"page[size]":{"type":"number","default":20,"maximum":100,"minimum":1,"description":"Default: 20. Min: 1. Max: 100."},"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"}},"required":["id","revision"]},
    method: "get",
    pathTemplate: "/api/profile-bulk-import-jobs/{id}/profiles",
    executionParameters: [{"name":"id","in":"path"},{"name":"additional-fields[profile]","in":"query"},{"name":"fields[profile]","in":"query"},{"name":"page[cursor]","in":"query"},{"name":"page[size]","in":"query"},{"name":"revision","in":"header"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Profiles"],
    deprecated: false
  }],
  ["get_profile_ids_for_bulk_import_profiles_job", {
    name: "get_profile_ids_for_bulk_import_profiles_job",
    description: `Get profile relationships for the bulk profile import job with the given ID.<br><br>*Rate limits*:<br>Burst: \`10/s\`<br>Steady: \`150/m\`

**Scopes:**
\`profiles:read\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/get_profile_ids_for_bulk_import_profiles_job.json)
(Tags: Profiles)`,
    inputSchema: {"type":"object","properties":{"id":{"type":"string"},"page[cursor]":{"type":"string","description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#pagination"},"page[size]":{"type":"number","default":20,"maximum":100,"minimum":1,"description":"Default: 20. Min: 1. Max: 100."},"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"}},"required":["id","revision"]},
    method: "get",
    pathTemplate: "/api/profile-bulk-import-jobs/{id}/relationships/profiles",
    executionParameters: [{"name":"id","in":"path"},{"name":"page[cursor]","in":"query"},{"name":"page[size]","in":"query"},{"name":"revision","in":"header"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Profiles"],
    deprecated: false
  }],
  ["get_errors_for_bulk_import_profiles_job", {
    name: "get_errors_for_bulk_import_profiles_job",
    description: `Get import errors for the bulk profile import job with the given ID.<br><br>*Rate limits*:<br>Burst: \`10/s\`<br>Steady: \`150/m\`

**Scopes:**
\`profiles:read\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/get_errors_for_bulk_import_profiles_job.json)
(Tags: Profiles)`,
    inputSchema: {"type":"object","properties":{"id":{"type":"string"},"fields[import-error]":{"type":"array","items":{"type":"string","enum":["code","detail","id","original_payload","source","source.pointer","title"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sparse-fieldsets"},"page[cursor]":{"type":"string","description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#pagination"},"page[size]":{"type":"number","default":20,"maximum":100,"minimum":1,"description":"Default: 20. Min: 1. Max: 100."},"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"}},"required":["id","revision"]},
    method: "get",
    pathTemplate: "/api/profile-bulk-import-jobs/{id}/import-errors",
    executionParameters: [{"name":"id","in":"path"},{"name":"fields[import-error]","in":"query"},{"name":"page[cursor]","in":"query"},{"name":"page[size]","in":"query"},{"name":"revision","in":"header"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Profiles"],
    deprecated: false
  }],
  ["get_profile_for_push_token", {
    name: "get_profile_for_push_token",
    description: `Return the profile associated with the given push token.<br><br>*Rate limits*:<br>Burst: \`10/s\`<br>Steady: \`150/m\`

**Scopes:**
\`profiles:read\`
\`push-tokens:read\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/get_profile_for_push_token.json)
(Tags: Profiles)`,
    inputSchema: {"type":"object","properties":{"id":{"description":"The value of the push token","type":"string"},"additional-fields[profile]":{"type":"array","items":{"type":"string","enum":["subscriptions","predictive_analytics"]},"description":"Request additional fields not included by default in the response. Supported values: 'subscriptions', 'predictive_analytics'"},"fields[profile]":{"type":"array","items":{"type":"string","enum":["created","email","external_id","first_name","id","image","last_event_date","last_name","locale","location","location.address1","location.address2","location.city","location.country","location.ip","location.latitude","location.longitude","location.region","location.timezone","location.zip","organization","phone_number","predictive_analytics","predictive_analytics.average_days_between_orders","predictive_analytics.average_order_value","predictive_analytics.churn_probability","predictive_analytics.expected_date_of_next_order","predictive_analytics.historic_clv","predictive_analytics.historic_number_of_orders","predictive_analytics.predicted_clv","predictive_analytics.predicted_number_of_orders","predictive_analytics.ranked_channel_affinity","predictive_analytics.total_clv","properties","subscriptions","subscriptions.email","subscriptions.email.marketing","subscriptions.email.marketing.can_receive_email_marketing","subscriptions.email.marketing.consent","subscriptions.email.marketing.consent_timestamp","subscriptions.email.marketing.custom_method_detail","subscriptions.email.marketing.double_optin","subscriptions.email.marketing.last_updated","subscriptions.email.marketing.list_suppressions","subscriptions.email.marketing.method","subscriptions.email.marketing.method_detail","subscriptions.email.marketing.suppression","subscriptions.mobile_push","subscriptions.mobile_push.marketing","subscriptions.mobile_push.marketing.can_receive_push_marketing","subscriptions.mobile_push.marketing.consent","subscriptions.mobile_push.marketing.consent_timestamp","subscriptions.sms","subscriptions.sms.marketing","subscriptions.sms.marketing.can_receive_sms_marketing","subscriptions.sms.marketing.consent","subscriptions.sms.marketing.consent_timestamp","subscriptions.sms.marketing.last_updated","subscriptions.sms.marketing.method","subscriptions.sms.marketing.method_detail","subscriptions.sms.transactional","subscriptions.sms.transactional.can_receive_sms_transactional","subscriptions.sms.transactional.consent","subscriptions.sms.transactional.consent_timestamp","subscriptions.sms.transactional.last_updated","subscriptions.sms.transactional.method","subscriptions.sms.transactional.method_detail","subscriptions.whatsapp","subscriptions.whatsapp.conversational","subscriptions.whatsapp.conversational.can_receive","subscriptions.whatsapp.conversational.consent","subscriptions.whatsapp.conversational.consent_timestamp","subscriptions.whatsapp.conversational.created_timestamp","subscriptions.whatsapp.conversational.last_updated","subscriptions.whatsapp.conversational.metadata","subscriptions.whatsapp.conversational.phone_number","subscriptions.whatsapp.conversational.valid_until","subscriptions.whatsapp.marketing","subscriptions.whatsapp.marketing.can_receive","subscriptions.whatsapp.marketing.consent","subscriptions.whatsapp.marketing.consent_timestamp","subscriptions.whatsapp.marketing.created_timestamp","subscriptions.whatsapp.marketing.last_updated","subscriptions.whatsapp.marketing.metadata","subscriptions.whatsapp.marketing.phone_number","subscriptions.whatsapp.marketing.valid_until","subscriptions.whatsapp.transactional","subscriptions.whatsapp.transactional.can_receive","subscriptions.whatsapp.transactional.consent","subscriptions.whatsapp.transactional.consent_timestamp","subscriptions.whatsapp.transactional.created_timestamp","subscriptions.whatsapp.transactional.last_updated","subscriptions.whatsapp.transactional.metadata","subscriptions.whatsapp.transactional.phone_number","subscriptions.whatsapp.transactional.valid_until","title","updated"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sparse-fieldsets"},"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"}},"required":["id","revision"]},
    method: "get",
    pathTemplate: "/api/push-tokens/{id}/profile",
    executionParameters: [{"name":"id","in":"path"},{"name":"additional-fields[profile]","in":"query"},{"name":"fields[profile]","in":"query"},{"name":"revision","in":"header"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Profiles"],
    deprecated: false
  }],
  ["get_profile_id_for_push_token", {
    name: "get_profile_id_for_push_token",
    description: `Return the ID of the profile associated with the given push token.<br><br>*Rate limits*:<br>Burst: \`10/s\`<br>Steady: \`150/m\`

**Scopes:**
\`profiles:read\`
\`push-tokens:read\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/get_profile_id_for_push_token.json)
(Tags: Profiles)`,
    inputSchema: {"type":"object","properties":{"id":{"description":"The value of the push token","type":"string"},"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"}},"required":["id","revision"]},
    method: "get",
    pathTemplate: "/api/push-tokens/{id}/relationships/profile",
    executionParameters: [{"name":"id","in":"path"},{"name":"revision","in":"header"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Profiles"],
    deprecated: false
  }],
  ["request_profile_deletion", {
    name: "request_profile_deletion",
    description: `Async + irreversible compliance job. Profile is not deleted immediately — deletion is queued and processed asynchronously. No soft-delete, no undo. Rate limit: burst 3/s, steady 60/min. KNOWN ISSUE: Intermittent 401 errors occur immediately after a Klaviyo API revision bump with a valid key — wait and retry before rotating keys (confirmed April 2026 community thread).

Request a deletion for the profiles corresponding to one of the following identifiers: \`email\`, \`phone_number\`, or \`id\`. If multiple identifiers are provided, we will return an error.

All profiles that match the provided identifier will be deleted.

The deletion occurs asynchronously; however, once it has completed, the deleted profile will appear on the [Deleted Profiles page](https://www.klaviyo.com/account/deleted).

For more information on the deletion process, please refer to our [Help Center docs on how to handle GDPR and CCPA deletion requests](https://help.klaviyo.com/hc/en-us/articles/360004217631-How-to-Handle-GDPR-Requests#record-gdpr-and-ccpa%20%20-deletion-requests2).<br><br>*Rate limits*:<br>Burst: \`3/s\`<br>Steady: \`60/m\`

**Scopes:**
\`data-privacy:write\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/request_profile_deletion.json)
(Tags: Data Privacy)`,
    inputSchema: {"type":"object","properties":{"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"},"requestBody":{"type":"string","description":"Request body (content type: application/vnd.api+json)"}},"required":["revision","requestBody"]},
    method: "post",
    pathTemplate: "/api/data-privacy-deletion-jobs",
    executionParameters: [{"name":"revision","in":"header"}],
    requestBodyContentType: "application/vnd.api+json",
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Data Privacy"],
    deprecated: false
  }],
  ["get_lists", {
    name: "get_lists",
    description: `Get all lists in an account.

Filter to request a subset of all lists. Lists can be filtered by \`id\`, \`name\`, \`created\`, and \`updated\` fields.

Returns a maximum of 10 results per page.<br><br>*Rate limits*:<br>Burst: \`75/s\`<br>Steady: \`750/m\`

**Scopes:**
\`lists:read\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/get_lists.json)
(Tags: Lists)`,
    inputSchema: {"type":"object","properties":{"fields[flow]":{"type":"array","items":{"type":"string","enum":["archived","created","id","name","status","trigger_type","updated"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sparse-fieldsets"},"fields[list]":{"type":"array","items":{"type":"string","enum":["created","id","name","opt_in_process","updated"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sparse-fieldsets"},"fields[tag]":{"type":"array","items":{"type":"string","enum":["id","name"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sparse-fieldsets"},"filter":{"type":"string","description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#filtering<br>Allowed field(s)/operator(s):<br>`name`: `any`, `equals`<br>`id`: `any`, `equals`<br>`created`: `greater-than`<br>`updated`: `greater-than`"},"include":{"type":"array","items":{"type":"string","enum":["flow-triggers","tags"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#relationships"},"page[cursor]":{"type":"string","description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#pagination"},"page[size]":{"type":"number","default":10,"maximum":10,"minimum":1,"description":"Default: 10. Min: 1. Max: 10."},"sort":{"type":"string","enum":["created","-created","id","-id","name","-name","updated","-updated"],"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sorting"},"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"}},"required":["revision"]},
    method: "get",
    pathTemplate: "/api/lists",
    executionParameters: [{"name":"fields[flow]","in":"query"},{"name":"fields[list]","in":"query"},{"name":"fields[tag]","in":"query"},{"name":"filter","in":"query"},{"name":"include","in":"query"},{"name":"page[cursor]","in":"query"},{"name":"page[size]","in":"query"},{"name":"sort","in":"query"},{"name":"revision","in":"header"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Lists"],
    deprecated: false
  }],
  ["create_list", {
    name: "create_list",
    description: `Create a new list.<br><br>*Rate limits*:<br>Burst: \`10/s\`<br>Steady: \`150/m\`<br>Daily: \`150/d\`

**Scopes:**
\`lists:write\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/create_list.json)
(Tags: Lists)`,
    inputSchema: {"type":"object","properties":{"fields[list]":{"type":"array","items":{"type":"string","enum":["created","id","name","opt_in_process","updated"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sparse-fieldsets"},"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"},"requestBody":{"type":"string","description":"Request body (content type: application/vnd.api+json)"}},"required":["revision","requestBody"]},
    method: "post",
    pathTemplate: "/api/lists",
    executionParameters: [{"name":"fields[list]","in":"query"},{"name":"revision","in":"header"}],
    requestBodyContentType: "application/vnd.api+json",
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Lists"],
    deprecated: false
  }],
  ["get_list", {
    name: "get_list",
    description: `Get a list with the given list ID.<br><br>*Rate limits*:<br>Burst: \`75/s\`<br>Steady: \`750/m\`<br><br>Rate limits when using the \`additional-fields[list]=profile_count\` parameter in your API request:<br>Burst: \`1/s\`<br>Steady: \`15/m\`<br><br>To learn more about how the \`additional-fields\` parameter impacts rate limits, check out our [Rate limits, status codes, and errors](https://developers.klaviyo.com/en/v2026-04-15/docs/rate_limits_and_error_handling) guide.

**Scopes:**
\`lists:read\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/get_list.json)
(Tags: Lists)`,
    inputSchema: {"type":"object","properties":{"id":{"description":"Primary key that uniquely identifies this list. Generated by Klaviyo.","type":"string"},"additional-fields[list]":{"type":"array","items":{"type":"string","enum":["profile_count"]},"description":"Request additional fields not included by default in the response. Supported values: 'profile_count'"},"fields[flow]":{"type":"array","items":{"type":"string","enum":["archived","created","id","name","status","trigger_type","updated"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sparse-fieldsets"},"fields[list]":{"type":"array","items":{"type":"string","enum":["created","id","name","opt_in_process","profile_count","updated"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sparse-fieldsets"},"fields[tag]":{"type":"array","items":{"type":"string","enum":["id","name"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sparse-fieldsets"},"include":{"type":"array","items":{"type":"string","enum":["flow-triggers","tags"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#relationships"},"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"}},"required":["id","revision"]},
    method: "get",
    pathTemplate: "/api/lists/{id}",
    executionParameters: [{"name":"id","in":"path"},{"name":"additional-fields[list]","in":"query"},{"name":"fields[flow]","in":"query"},{"name":"fields[list]","in":"query"},{"name":"fields[tag]","in":"query"},{"name":"include","in":"query"},{"name":"revision","in":"header"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Lists"],
    deprecated: false
  }],
  ["delete_list", {
    name: "delete_list",
    description: `Delete a list with the given list ID.<br><br>*Rate limits*:<br>Burst: \`10/s\`<br>Steady: \`150/m\`

**Scopes:**
\`lists:write\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/delete_list.json)
(Tags: Lists)`,
    inputSchema: {"type":"object","properties":{"id":{"description":"Primary key that uniquely identifies this list. Generated by Klaviyo.","type":"string"},"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"}},"required":["id","revision"]},
    method: "delete",
    pathTemplate: "/api/lists/{id}",
    executionParameters: [{"name":"id","in":"path"},{"name":"revision","in":"header"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Lists"],
    deprecated: false
  }],
  ["update_list", {
    name: "update_list",
    description: `Update the name of a list with the given list ID.<br><br>*Rate limits*:<br>Burst: \`10/s\`<br>Steady: \`150/m\`

**Scopes:**
\`lists:write\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/update_list.json)
(Tags: Lists)`,
    inputSchema: {"type":"object","properties":{"id":{"description":"Primary key that uniquely identifies this list. Generated by Klaviyo.","type":"string"},"fields[list]":{"type":"array","items":{"type":"string","enum":["created","id","name","opt_in_process","updated"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sparse-fieldsets"},"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"},"requestBody":{"type":"string","description":"Request body (content type: application/vnd.api+json)"}},"required":["id","revision","requestBody"]},
    method: "patch",
    pathTemplate: "/api/lists/{id}",
    executionParameters: [{"name":"id","in":"path"},{"name":"fields[list]","in":"query"},{"name":"revision","in":"header"}],
    requestBodyContentType: "application/vnd.api+json",
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Lists"],
    deprecated: false
  }],
  ["get_tags_for_list", {
    name: "get_tags_for_list",
    description: `Return all tags associated with the given list ID.<br><br>*Rate limits*:<br>Burst: \`3/s\`<br>Steady: \`60/m\`

**Scopes:**
\`lists:read\`
\`tags:read\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/get_tags_for_list.json)
(Tags: Lists)`,
    inputSchema: {"type":"object","properties":{"id":{"description":"Primary key that uniquely identifies this list. Generated by Klaviyo.","type":"string"},"fields[tag]":{"type":"array","items":{"type":"string","enum":["id","name"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sparse-fieldsets"},"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"}},"required":["id","revision"]},
    method: "get",
    pathTemplate: "/api/lists/{id}/tags",
    executionParameters: [{"name":"id","in":"path"},{"name":"fields[tag]","in":"query"},{"name":"revision","in":"header"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Lists"],
    deprecated: false
  }],
  ["get_tag_ids_for_list", {
    name: "get_tag_ids_for_list",
    description: `Return all tags associated with the given list ID.<br><br>*Rate limits*:<br>Burst: \`3/s\`<br>Steady: \`60/m\`

**Scopes:**
\`lists:read\`
\`tags:read\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/get_tag_ids_for_list.json)
(Tags: Lists)`,
    inputSchema: {"type":"object","properties":{"id":{"description":"Primary key that uniquely identifies this list. Generated by Klaviyo.","type":"string"},"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"}},"required":["id","revision"]},
    method: "get",
    pathTemplate: "/api/lists/{id}/relationships/tags",
    executionParameters: [{"name":"id","in":"path"},{"name":"revision","in":"header"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Lists"],
    deprecated: false
  }],
  ["get_profiles_for_list", {
    name: "get_profiles_for_list",
    description: `Get all profiles within a list with the given list ID.

Filter to request a subset of all profiles. Profiles can be filtered by \`email\`, \`phone_number\`, \`push_token\`, and \`joined_group_at\` fields. Profiles can be sorted by the following fields, in ascending and descending order: \`joined_group_at\`<br><br>*Rate limits*:<br>Burst: \`75/s\`<br>Steady: \`750/m\`<br><br>Rate limits when using the \`additional-fields[profile]=predictive_analytics\` parameter in your API request:<br>Burst: \`10/s\`<br>Steady: \`150/m\`<br><br>To learn more about how the \`additional-fields\` parameter impacts rate limits, check out our [Rate limits, status codes, and errors](https://developers.klaviyo.com/en/v2026-04-15/docs/rate_limits_and_error_handling) guide.

**Scopes:**
\`lists:read\`
\`profiles:read\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/get_profiles_for_list.json)
(Tags: Lists)`,
    inputSchema: {"type":"object","properties":{"id":{"description":"Primary key that uniquely identifies this list. Generated by Klaviyo.","type":"string"},"additional-fields[profile]":{"type":"array","items":{"type":"string","enum":["subscriptions","predictive_analytics"]},"description":"Request additional fields not included by default in the response. Supported values: 'subscriptions', 'predictive_analytics'"},"fields[profile]":{"type":"array","items":{"type":"string","enum":["created","email","external_id","first_name","id","image","joined_group_at","last_event_date","last_name","locale","location","location.address1","location.address2","location.city","location.country","location.ip","location.latitude","location.longitude","location.region","location.timezone","location.zip","organization","phone_number","predictive_analytics","predictive_analytics.average_days_between_orders","predictive_analytics.average_order_value","predictive_analytics.churn_probability","predictive_analytics.expected_date_of_next_order","predictive_analytics.historic_clv","predictive_analytics.historic_number_of_orders","predictive_analytics.predicted_clv","predictive_analytics.predicted_number_of_orders","predictive_analytics.ranked_channel_affinity","predictive_analytics.total_clv","properties","subscriptions","subscriptions.email","subscriptions.email.marketing","subscriptions.email.marketing.can_receive_email_marketing","subscriptions.email.marketing.consent","subscriptions.email.marketing.consent_timestamp","subscriptions.email.marketing.custom_method_detail","subscriptions.email.marketing.double_optin","subscriptions.email.marketing.last_updated","subscriptions.email.marketing.list_suppressions","subscriptions.email.marketing.method","subscriptions.email.marketing.method_detail","subscriptions.email.marketing.suppression","subscriptions.mobile_push","subscriptions.mobile_push.marketing","subscriptions.mobile_push.marketing.can_receive_push_marketing","subscriptions.mobile_push.marketing.consent","subscriptions.mobile_push.marketing.consent_timestamp","subscriptions.sms","subscriptions.sms.marketing","subscriptions.sms.marketing.can_receive_sms_marketing","subscriptions.sms.marketing.consent","subscriptions.sms.marketing.consent_timestamp","subscriptions.sms.marketing.last_updated","subscriptions.sms.marketing.method","subscriptions.sms.marketing.method_detail","subscriptions.sms.transactional","subscriptions.sms.transactional.can_receive_sms_transactional","subscriptions.sms.transactional.consent","subscriptions.sms.transactional.consent_timestamp","subscriptions.sms.transactional.last_updated","subscriptions.sms.transactional.method","subscriptions.sms.transactional.method_detail","subscriptions.whatsapp","subscriptions.whatsapp.conversational","subscriptions.whatsapp.conversational.can_receive","subscriptions.whatsapp.conversational.consent","subscriptions.whatsapp.conversational.consent_timestamp","subscriptions.whatsapp.conversational.created_timestamp","subscriptions.whatsapp.conversational.last_updated","subscriptions.whatsapp.conversational.metadata","subscriptions.whatsapp.conversational.phone_number","subscriptions.whatsapp.conversational.valid_until","subscriptions.whatsapp.marketing","subscriptions.whatsapp.marketing.can_receive","subscriptions.whatsapp.marketing.consent","subscriptions.whatsapp.marketing.consent_timestamp","subscriptions.whatsapp.marketing.created_timestamp","subscriptions.whatsapp.marketing.last_updated","subscriptions.whatsapp.marketing.metadata","subscriptions.whatsapp.marketing.phone_number","subscriptions.whatsapp.marketing.valid_until","subscriptions.whatsapp.transactional","subscriptions.whatsapp.transactional.can_receive","subscriptions.whatsapp.transactional.consent","subscriptions.whatsapp.transactional.consent_timestamp","subscriptions.whatsapp.transactional.created_timestamp","subscriptions.whatsapp.transactional.last_updated","subscriptions.whatsapp.transactional.metadata","subscriptions.whatsapp.transactional.phone_number","subscriptions.whatsapp.transactional.valid_until","title","updated"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sparse-fieldsets"},"filter":{"type":"string","description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#filtering<br>Allowed field(s)/operator(s):<br>`email`: `any`, `equals`<br>`phone_number`: `any`, `equals`<br>`push_token`: `any`, `equals`<br>`_kx`: `equals`<br>`joined_group_at`: `greater-or-equal`, `greater-than`, `less-or-equal`, `less-than`"},"page[cursor]":{"type":"string","description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#pagination"},"page[size]":{"type":"number","default":20,"maximum":100,"minimum":1,"description":"Default: 20. Min: 1. Max: 100."},"sort":{"type":"string","enum":["joined_group_at","-joined_group_at"],"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sorting"},"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"}},"required":["id","revision"]},
    method: "get",
    pathTemplate: "/api/lists/{id}/profiles",
    executionParameters: [{"name":"id","in":"path"},{"name":"additional-fields[profile]","in":"query"},{"name":"fields[profile]","in":"query"},{"name":"filter","in":"query"},{"name":"page[cursor]","in":"query"},{"name":"page[size]","in":"query"},{"name":"sort","in":"query"},{"name":"revision","in":"header"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Lists"],
    deprecated: false
  }],
  ["get_profile_ids_for_list", {
    name: "get_profile_ids_for_list",
    description: `Get profile membership [relationships](https://developers.klaviyo.com/en/reference/api_overview#relationships) for a list with the given list ID.<br><br>*Rate limits*:<br>Burst: \`75/s\`<br>Steady: \`750/m\`<br><br>Rate limits when using the \`additional-fields[profile]=predictive_analytics\` parameter in your API request:<br>Burst: \`10/s\`<br>Steady: \`150/m\`<br><br>To learn more about how the \`additional-fields\` parameter impacts rate limits, check out our [Rate limits, status codes, and errors](https://developers.klaviyo.com/en/v2026-04-15/docs/rate_limits_and_error_handling) guide.

**Scopes:**
\`lists:read\`
\`profiles:read\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/get_profile_ids_for_list.json)
(Tags: Lists)`,
    inputSchema: {"type":"object","properties":{"id":{"description":"Primary key that uniquely identifies this list. Generated by Klaviyo.","type":"string"},"filter":{"type":"string","description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#filtering<br>Allowed field(s)/operator(s):<br>`email`: `any`, `equals`<br>`phone_number`: `any`, `equals`<br>`push_token`: `any`, `equals`<br>`_kx`: `equals`<br>`joined_group_at`: `greater-or-equal`, `greater-than`, `less-or-equal`, `less-than`"},"page[cursor]":{"type":"string","description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#pagination"},"page[size]":{"type":"number","default":20,"maximum":100,"minimum":1,"description":"Default: 20. Min: 1. Max: 100."},"sort":{"type":"string","enum":["joined_group_at","-joined_group_at"],"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sorting"},"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"}},"required":["id","revision"]},
    method: "get",
    pathTemplate: "/api/lists/{id}/relationships/profiles",
    executionParameters: [{"name":"id","in":"path"},{"name":"filter","in":"query"},{"name":"page[cursor]","in":"query"},{"name":"page[size]","in":"query"},{"name":"sort","in":"query"},{"name":"revision","in":"header"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Lists"],
    deprecated: false
  }],
  ["add_profiles_to_list", {
    name: "add_profiles_to_list",
    description: `Adds profile to list immediately without granting marketing consent. Requires profile ID — not email. For net-new contacts, call POST /api/profiles first to obtain an ID.

Add a profile to a list with the given list ID.

It is recommended that you use the [Subscribe Profiles endpoint](https://developers.klaviyo.com/en/reference/subscribe_profiles) if you're trying to give a profile [consent](https://developers.klaviyo.com/en/docs/collect_email_and_sms_consent_via_api) to receive email marketing, SMS marketing, or both.

This endpoint accepts a maximum of 1000 profiles per call.<br><br>*Rate limits*:<br>Burst: \`10/s\`<br>Steady: \`150/m\`

**Scopes:**
\`lists:write\`
\`profiles:write\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/add_profiles_to_list.json)
(Tags: Lists)`,
    inputSchema: {"type":"object","properties":{"id":{"type":"string"},"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"},"requestBody":{"type":"string","description":"Request body (content type: application/vnd.api+json)"}},"required":["id","revision","requestBody"]},
    method: "post",
    pathTemplate: "/api/lists/{id}/relationships/profiles",
    executionParameters: [{"name":"id","in":"path"},{"name":"revision","in":"header"}],
    requestBodyContentType: "application/vnd.api+json",
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Lists"],
    deprecated: false
  }],
  ["remove_profiles_from_list", {
    name: "remove_profiles_from_list",
    description: `Removes from list only. Does NOT affect subscription or consent status. Use the Profiles Unsubscribe endpoint to stop marketing communications.

Remove a profile from a list with the given list ID.

The provided profile will no longer receive marketing from this particular list once removed.

Removing a profile from a list will not impact the profile's [consent](https://developers.klaviyo.com/en/docs/collect_email_and_sms_consent_via_api) status or subscription status in general.
To update a profile's subscription status, please use the [Unsubscribe Profiles endpoint](https://developers.klaviyo.com/en/reference/unsubscribe_profiles).

This endpoint accepts a maximum of 1000 profiles per call.<br><br>*Rate limits*:<br>Burst: \`10/s\`<br>Steady: \`150/m\`

**Scopes:**
\`lists:write\`
\`profiles:write\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/remove_profiles_from_list.json)
(Tags: Lists)`,
    inputSchema: {"type":"object","properties":{"id":{"type":"string"},"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"},"requestBody":{"type":"string","description":"Request body (content type: application/vnd.api+json)"}},"required":["id","revision","requestBody"]},
    method: "delete",
    pathTemplate: "/api/lists/{id}/relationships/profiles",
    executionParameters: [{"name":"id","in":"path"},{"name":"revision","in":"header"}],
    requestBodyContentType: "application/vnd.api+json",
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Lists"],
    deprecated: false
  }],
  ["get_flows_triggered_by_list", {
    name: "get_flows_triggered_by_list",
    description: `Get all flows where the given list ID is being used as the trigger.<br><br>*Rate limits*:<br>Burst: \`3/s\`<br>Steady: \`60/m\`

**Scopes:**
\`flows:read\`
\`lists:read\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/get_flows_triggered_by_list.json)
(Tags: Lists)`,
    inputSchema: {"type":"object","properties":{"id":{"description":"Primary key that uniquely identifies this list. Generated by Klaviyo.","type":"string"},"fields[flow]":{"type":"array","items":{"type":"string","enum":["archived","created","id","name","status","trigger_type","updated"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sparse-fieldsets"},"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"}},"required":["id","revision"]},
    method: "get",
    pathTemplate: "/api/lists/{id}/flow-triggers",
    executionParameters: [{"name":"id","in":"path"},{"name":"fields[flow]","in":"query"},{"name":"revision","in":"header"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Lists"],
    deprecated: false
  }],
  ["get_ids_for_flows_triggered_by_list", {
    name: "get_ids_for_flows_triggered_by_list",
    description: `Get the IDs of all flows where the given list is being used as the trigger.<br><br>*Rate limits*:<br>Burst: \`3/s\`<br>Steady: \`60/m\`

**Scopes:**
\`flows:read\`
\`lists:read\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/get_ids_for_flows_triggered_by_list.json)
(Tags: Lists)`,
    inputSchema: {"type":"object","properties":{"id":{"description":"Primary key that uniquely identifies this list. Generated by Klaviyo.","type":"string"},"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"}},"required":["id","revision"]},
    method: "get",
    pathTemplate: "/api/lists/{id}/relationships/flow-triggers",
    executionParameters: [{"name":"id","in":"path"},{"name":"revision","in":"header"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Lists"],
    deprecated: false
  }],
  ["get_segments", {
    name: "get_segments",
    description: `Get all segments in an account.

Filter to request a subset of all segments. Segments can be filtered by \`name\`, \`created\`, and \`updated\` fields.

Returns a maximum of 10 results per page.<br><br>*Rate limits*:<br>Burst: \`75/s\`<br>Steady: \`750/m\`

**Scopes:**
\`segments:read\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/get_segments.json)
(Tags: Segments)`,
    inputSchema: {"type":"object","properties":{"fields[flow]":{"type":"array","items":{"type":"string","enum":["archived","created","id","name","status","trigger_type","updated"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sparse-fieldsets"},"fields[segment]":{"type":"array","items":{"type":"string","enum":["created","definition","definition.condition_groups","id","is_active","is_processing","is_starred","name","updated"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sparse-fieldsets"},"fields[tag]":{"type":"array","items":{"type":"string","enum":["id","name"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sparse-fieldsets"},"filter":{"type":"string","description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#filtering<br>Allowed field(s)/operator(s):<br>`name`: `any`, `equals`<br>`id`: `any`, `equals`<br>`created`: `greater-than`<br>`updated`: `greater-than`<br>`is_active`: `any`, `equals`<br>`is_starred`: `equals`"},"include":{"type":"array","items":{"type":"string","enum":["flow-triggers","tags"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#relationships"},"page[cursor]":{"type":"string","description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#pagination"},"page[size]":{"type":"number","default":10,"maximum":10,"minimum":1,"description":"Default: 10. Min: 1. Max: 10."},"sort":{"type":"string","enum":["created","-created","id","-id","name","-name","updated","-updated"],"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sorting"},"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"}},"required":["revision"]},
    method: "get",
    pathTemplate: "/api/segments",
    executionParameters: [{"name":"fields[flow]","in":"query"},{"name":"fields[segment]","in":"query"},{"name":"fields[tag]","in":"query"},{"name":"filter","in":"query"},{"name":"include","in":"query"},{"name":"page[cursor]","in":"query"},{"name":"page[size]","in":"query"},{"name":"sort","in":"query"},{"name":"revision","in":"header"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Segments"],
    deprecated: false
  }],
  ["create_segment", {
    name: "create_segment",
    description: `Daily cap: 100 segments/day (burst 1/s, steady 15/min). Segment membership is computed — there is no add-member endpoint. An empty segment after creation means profiles lack the expected property values, not a configuration error. Membership updates 10–60 seconds after profile data changes.

Create a segment.<br><br>*Rate limits*:<br>Burst: \`1/s\`<br>Steady: \`15/m\`<br>Daily: \`100/d\`

**Scopes:**
\`segments:write\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/create_segment.json)
(Tags: Segments)`,
    inputSchema: {"type":"object","properties":{"fields[segment]":{"type":"array","items":{"type":"string","enum":["created","definition","definition.condition_groups","id","is_active","is_processing","is_starred","name","updated"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sparse-fieldsets"},"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"},"requestBody":{"type":"string","description":"Request body (content type: application/vnd.api+json)"}},"required":["revision","requestBody"]},
    method: "post",
    pathTemplate: "/api/segments",
    executionParameters: [{"name":"fields[segment]","in":"query"},{"name":"revision","in":"header"}],
    requestBodyContentType: "application/vnd.api+json",
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Segments"],
    deprecated: false
  }],
  ["get_segment", {
    name: "get_segment",
    description: `Membership updates 10–60 seconds after profile data changes. Zero members = data quality issue (profiles missing the property values the rule references), not a config error. Wait 60s before diagnosing.

Get a segment with the given segment ID.<br><br>*Rate limits*:<br>Burst: \`75/s\`<br>Steady: \`750/m\`<br><br>Rate limits when using the \`additional-fields[segment]=profile_count\` parameter in your API request:<br>Burst: \`1/s\`<br>Steady: \`15/m\`<br><br>To learn more about how the \`additional-fields\` parameter impacts rate limits, check out our [Rate limits, status codes, and errors](https://developers.klaviyo.com/en/v2026-04-15/docs/rate_limits_and_error_handling) guide.

**Scopes:**
\`segments:read\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/get_segment.json)
(Tags: Segments)`,
    inputSchema: {"type":"object","properties":{"id":{"type":"string"},"additional-fields[segment]":{"type":"array","items":{"type":"string","enum":["profile_count"]},"description":"Request additional fields not included by default in the response. Supported values: 'profile_count'"},"fields[flow]":{"type":"array","items":{"type":"string","enum":["archived","created","id","name","status","trigger_type","updated"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sparse-fieldsets"},"fields[segment]":{"type":"array","items":{"type":"string","enum":["created","definition","definition.condition_groups","id","is_active","is_processing","is_starred","name","profile_count","updated"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sparse-fieldsets"},"fields[tag]":{"type":"array","items":{"type":"string","enum":["id","name"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sparse-fieldsets"},"include":{"type":"array","items":{"type":"string","enum":["flow-triggers","tags"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#relationships"},"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"}},"required":["id","revision"]},
    method: "get",
    pathTemplate: "/api/segments/{id}",
    executionParameters: [{"name":"id","in":"path"},{"name":"additional-fields[segment]","in":"query"},{"name":"fields[flow]","in":"query"},{"name":"fields[segment]","in":"query"},{"name":"fields[tag]","in":"query"},{"name":"include","in":"query"},{"name":"revision","in":"header"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Segments"],
    deprecated: false
  }],
  ["delete_segment", {
    name: "delete_segment",
    description: `Delete a segment with the given segment ID.<br><br>*Rate limits*:<br>Burst: \`3/s\`<br>Steady: \`60/m\`

**Scopes:**
\`segments:write\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/delete_segment.json)
(Tags: Segments)`,
    inputSchema: {"type":"object","properties":{"id":{"type":"string"},"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"}},"required":["id","revision"]},
    method: "delete",
    pathTemplate: "/api/segments/{id}",
    executionParameters: [{"name":"id","in":"path"},{"name":"revision","in":"header"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Segments"],
    deprecated: false
  }],
  ["update_segment", {
    name: "update_segment",
    description: `Update a segment with the given segment ID.<br><br>*Rate limits*:<br>Burst: \`1/s\`<br>Steady: \`15/m\`<br>Daily: \`100/d\`

**Scopes:**
\`segments:write\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/update_segment.json)
(Tags: Segments)`,
    inputSchema: {"type":"object","properties":{"id":{"type":"string"},"fields[segment]":{"type":"array","items":{"type":"string","enum":["created","definition","definition.condition_groups","id","is_active","is_processing","is_starred","name","updated"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sparse-fieldsets"},"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"},"requestBody":{"type":"string","description":"Request body (content type: application/vnd.api+json)"}},"required":["id","revision","requestBody"]},
    method: "patch",
    pathTemplate: "/api/segments/{id}",
    executionParameters: [{"name":"id","in":"path"},{"name":"fields[segment]","in":"query"},{"name":"revision","in":"header"}],
    requestBodyContentType: "application/vnd.api+json",
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Segments"],
    deprecated: false
  }],
  ["get_tags_for_segment", {
    name: "get_tags_for_segment",
    description: `Return all tags associated with the given segment ID.<br><br>*Rate limits*:<br>Burst: \`3/s\`<br>Steady: \`60/m\`

**Scopes:**
\`segments:read\`
\`tags:read\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/get_tags_for_segment.json)
(Tags: Segments)`,
    inputSchema: {"type":"object","properties":{"id":{"type":"string"},"fields[tag]":{"type":"array","items":{"type":"string","enum":["id","name"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sparse-fieldsets"},"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"}},"required":["id","revision"]},
    method: "get",
    pathTemplate: "/api/segments/{id}/tags",
    executionParameters: [{"name":"id","in":"path"},{"name":"fields[tag]","in":"query"},{"name":"revision","in":"header"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Segments"],
    deprecated: false
  }],
  ["get_tag_ids_for_segment", {
    name: "get_tag_ids_for_segment",
    description: `If \`related_resource\` is \`tags\`, returns the tag IDs of all tags associated with the given segment ID.<br><br>*Rate limits*:<br>Burst: \`3/s\`<br>Steady: \`60/m\`

**Scopes:**
\`segments:read\`
\`tags:read\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/get_tag_ids_for_segment.json)
(Tags: Segments)`,
    inputSchema: {"type":"object","properties":{"id":{"type":"string"},"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"}},"required":["id","revision"]},
    method: "get",
    pathTemplate: "/api/segments/{id}/relationships/tags",
    executionParameters: [{"name":"id","in":"path"},{"name":"revision","in":"header"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Segments"],
    deprecated: false
  }],
  ["get_profiles_for_segment", {
    name: "get_profiles_for_segment",
    description: `Get all profiles within a segment with the given segment ID.

Filter to request a subset of all profiles. Profiles can be filtered by \`email\`, \`phone_number\`, \`push_token\`, and \`joined_group_at\` fields. Profiles can be sorted by the following fields, in ascending and descending order: \`joined_group_at\`<br><br>*Rate limits*:<br>Burst: \`75/s\`<br>Steady: \`750/m\`

**Scopes:**
\`profiles:read\`
\`segments:read\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/get_profiles_for_segment.json)
(Tags: Segments)`,
    inputSchema: {"type":"object","properties":{"id":{"description":"Primary key that uniquely identifies this segment. Generated by Klaviyo.","type":"string"},"additional-fields[profile]":{"type":"array","items":{"type":"string","enum":["subscriptions","predictive_analytics"]},"description":"Request additional fields not included by default in the response. Supported values: 'subscriptions', 'predictive_analytics'"},"fields[profile]":{"type":"array","items":{"type":"string","enum":["created","email","external_id","first_name","id","image","joined_group_at","last_event_date","last_name","locale","location","location.address1","location.address2","location.city","location.country","location.ip","location.latitude","location.longitude","location.region","location.timezone","location.zip","organization","phone_number","predictive_analytics","predictive_analytics.average_days_between_orders","predictive_analytics.average_order_value","predictive_analytics.churn_probability","predictive_analytics.expected_date_of_next_order","predictive_analytics.historic_clv","predictive_analytics.historic_number_of_orders","predictive_analytics.predicted_clv","predictive_analytics.predicted_number_of_orders","predictive_analytics.ranked_channel_affinity","predictive_analytics.total_clv","properties","subscriptions","subscriptions.email","subscriptions.email.marketing","subscriptions.email.marketing.can_receive_email_marketing","subscriptions.email.marketing.consent","subscriptions.email.marketing.consent_timestamp","subscriptions.email.marketing.custom_method_detail","subscriptions.email.marketing.double_optin","subscriptions.email.marketing.last_updated","subscriptions.email.marketing.list_suppressions","subscriptions.email.marketing.method","subscriptions.email.marketing.method_detail","subscriptions.email.marketing.suppression","subscriptions.mobile_push","subscriptions.mobile_push.marketing","subscriptions.mobile_push.marketing.can_receive_push_marketing","subscriptions.mobile_push.marketing.consent","subscriptions.mobile_push.marketing.consent_timestamp","subscriptions.sms","subscriptions.sms.marketing","subscriptions.sms.marketing.can_receive_sms_marketing","subscriptions.sms.marketing.consent","subscriptions.sms.marketing.consent_timestamp","subscriptions.sms.marketing.last_updated","subscriptions.sms.marketing.method","subscriptions.sms.marketing.method_detail","subscriptions.sms.transactional","subscriptions.sms.transactional.can_receive_sms_transactional","subscriptions.sms.transactional.consent","subscriptions.sms.transactional.consent_timestamp","subscriptions.sms.transactional.last_updated","subscriptions.sms.transactional.method","subscriptions.sms.transactional.method_detail","subscriptions.whatsapp","subscriptions.whatsapp.conversational","subscriptions.whatsapp.conversational.can_receive","subscriptions.whatsapp.conversational.consent","subscriptions.whatsapp.conversational.consent_timestamp","subscriptions.whatsapp.conversational.created_timestamp","subscriptions.whatsapp.conversational.last_updated","subscriptions.whatsapp.conversational.metadata","subscriptions.whatsapp.conversational.phone_number","subscriptions.whatsapp.conversational.valid_until","subscriptions.whatsapp.marketing","subscriptions.whatsapp.marketing.can_receive","subscriptions.whatsapp.marketing.consent","subscriptions.whatsapp.marketing.consent_timestamp","subscriptions.whatsapp.marketing.created_timestamp","subscriptions.whatsapp.marketing.last_updated","subscriptions.whatsapp.marketing.metadata","subscriptions.whatsapp.marketing.phone_number","subscriptions.whatsapp.marketing.valid_until","subscriptions.whatsapp.transactional","subscriptions.whatsapp.transactional.can_receive","subscriptions.whatsapp.transactional.consent","subscriptions.whatsapp.transactional.consent_timestamp","subscriptions.whatsapp.transactional.created_timestamp","subscriptions.whatsapp.transactional.last_updated","subscriptions.whatsapp.transactional.metadata","subscriptions.whatsapp.transactional.phone_number","subscriptions.whatsapp.transactional.valid_until","title","updated"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sparse-fieldsets"},"filter":{"type":"string","description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#filtering<br>Allowed field(s)/operator(s):<br>`profile_id`: `any`, `equals`<br>`email`: `any`, `equals`<br>`phone_number`: `any`, `equals`<br>`push_token`: `any`, `equals`<br>`_kx`: `equals`<br>`joined_group_at`: `greater-or-equal`, `greater-than`, `less-or-equal`, `less-than`"},"page[cursor]":{"type":"string","description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#pagination"},"page[size]":{"type":"number","default":20,"maximum":100,"minimum":1,"description":"Default: 20. Min: 1. Max: 100."},"sort":{"type":"string","enum":["joined_group_at","-joined_group_at"],"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sorting"},"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"}},"required":["id","revision"]},
    method: "get",
    pathTemplate: "/api/segments/{id}/profiles",
    executionParameters: [{"name":"id","in":"path"},{"name":"additional-fields[profile]","in":"query"},{"name":"fields[profile]","in":"query"},{"name":"filter","in":"query"},{"name":"page[cursor]","in":"query"},{"name":"page[size]","in":"query"},{"name":"sort","in":"query"},{"name":"revision","in":"header"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Segments"],
    deprecated: false
  }],
  ["get_profile_ids_for_segment", {
    name: "get_profile_ids_for_segment",
    description: `Get all profile membership [relationships](https://developers.klaviyo.com/en/reference/api_overview#relationships) for the given segment ID.<br><br>*Rate limits*:<br>Burst: \`75/s\`<br>Steady: \`750/m\`

**Scopes:**
\`profiles:read\`
\`segments:read\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/get_profile_ids_for_segment.json)
(Tags: Segments)`,
    inputSchema: {"type":"object","properties":{"id":{"description":"Primary key that uniquely identifies this segment. Generated by Klaviyo.","type":"string"},"filter":{"type":"string","description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#filtering<br>Allowed field(s)/operator(s):<br>`profile_id`: `any`, `equals`<br>`email`: `any`, `equals`<br>`phone_number`: `any`, `equals`<br>`push_token`: `any`, `equals`<br>`_kx`: `equals`<br>`joined_group_at`: `greater-or-equal`, `greater-than`, `less-or-equal`, `less-than`"},"page[cursor]":{"type":"string","description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#pagination"},"page[size]":{"type":"number","default":20,"maximum":100,"minimum":1,"description":"Default: 20. Min: 1. Max: 100."},"sort":{"type":"string","enum":["joined_group_at","-joined_group_at"],"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sorting"},"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"}},"required":["id","revision"]},
    method: "get",
    pathTemplate: "/api/segments/{id}/relationships/profiles",
    executionParameters: [{"name":"id","in":"path"},{"name":"filter","in":"query"},{"name":"page[cursor]","in":"query"},{"name":"page[size]","in":"query"},{"name":"sort","in":"query"},{"name":"revision","in":"header"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Segments"],
    deprecated: false
  }],
  ["get_flows_triggered_by_segment", {
    name: "get_flows_triggered_by_segment",
    description: `Get all flows where the given segment ID is being used as the trigger.<br><br>*Rate limits*:<br>Burst: \`3/s\`<br>Steady: \`60/m\`

**Scopes:**
\`flows:read\`
\`segments:read\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/get_flows_triggered_by_segment.json)
(Tags: Segments)`,
    inputSchema: {"type":"object","properties":{"id":{"description":"Primary key that uniquely identifies this segment. Generated by Klaviyo.","type":"string"},"fields[flow]":{"type":"array","items":{"type":"string","enum":["archived","created","id","name","status","trigger_type","updated"]},"description":"For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#sparse-fieldsets"},"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"}},"required":["id","revision"]},
    method: "get",
    pathTemplate: "/api/segments/{id}/flow-triggers",
    executionParameters: [{"name":"id","in":"path"},{"name":"fields[flow]","in":"query"},{"name":"revision","in":"header"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Segments"],
    deprecated: false
  }],
  ["get_ids_for_flows_triggered_by_segment", {
    name: "get_ids_for_flows_triggered_by_segment",
    description: `Get the IDs of all flows where the given segment is being used as the trigger.<br><br>*Rate limits*:<br>Burst: \`3/s\`<br>Steady: \`60/m\`

**Scopes:**
\`flows:read\`
\`segments:read\`

[OpenAPI Spec](https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable/apis/get_ids_for_flows_triggered_by_segment.json)
(Tags: Segments)`,
    inputSchema: {"type":"object","properties":{"id":{"description":"Primary key that uniquely identifies this segment. Generated by Klaviyo.","type":"string"},"revision":{"type":"string","default":"2026-04-15","description":"API endpoint revision (format: YYYY-MM-DD[.suffix])"}},"required":["id","revision"]},
    method: "get",
    pathTemplate: "/api/segments/{id}/relationships/flow-triggers",
    executionParameters: [{"name":"id","in":"path"},{"name":"revision","in":"header"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"Klaviyo-API-Key":[]}],
    tags: ["Segments"],
    deprecated: false
  }],
]);

/**
 * Security schemes from the OpenAPI spec
 */
const securitySchemes =   {
    "Klaviyo-API-Key": {
      "type": "apiKey",
      "in": "header",
      "name": "Authorization",
      "description": "Private key authentication for /api/ endpoints is performed by setting the `Authorization` header to `Klaviyo-API-Key your-private-api-key`<br>For more information please visit https://developers.klaviyo.com/en/v2026-04-15/reference/api-overview#authentication",
      "x-default": "Klaviyo-API-Key your-private-api-key"
    }
  };


server.setRequestHandler(ListToolsRequestSchema, async () => {
  const toolsForClient: Tool[] = Array.from(toolDefinitionMap.values()).map(def => ({
    name: def.name,
    description: def.description,
    inputSchema: def.inputSchema
  }));
  return { tools: toolsForClient };
});


server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest): Promise<CallToolResult> => {
  const { name: toolName, arguments: toolArgs } = request.params;
  const toolDefinition = toolDefinitionMap.get(toolName);
  if (!toolDefinition) {
    console.error(`Error: Unknown tool requested: ${toolName}`);
    return { content: [{ type: "text", text: `Error: Unknown tool requested: ${toolName}` }] };
  }
  return await executeApiTool(toolName, toolDefinition, toolArgs ?? {}, securitySchemes);
});



/**
 * Type definition for cached OAuth tokens
 */
interface TokenCacheEntry {
    token: string;
    expiresAt: number;
}

/**
 * Declare global __oauthTokenCache property for TypeScript
 */
declare global {
    var __oauthTokenCache: Record<string, TokenCacheEntry> | undefined;
}

/**
 * Acquires an OAuth2 token using client credentials flow
 * 
 * @param schemeName Name of the security scheme
 * @param scheme OAuth2 security scheme
 * @returns Acquired token or null if unable to acquire
 */
async function acquireOAuth2Token(schemeName: string, scheme: any): Promise<string | null | undefined> {
    try {
        // Check if we have the necessary credentials (resolved per-scheme at runtime)
        const clientId = process.env[`OAUTH_CLIENT_ID_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];
        const clientSecret = process.env[`OAUTH_CLIENT_SECRET_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];
        const scopes = process.env[`OAUTH_SCOPES_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];

        if (!clientId || !clientSecret) {
            console.error(`Missing client credentials for OAuth2 scheme '${schemeName}'`);
            return null;
        }
        
        // Initialize token cache if needed
        if (typeof global.__oauthTokenCache === 'undefined') {
            global.__oauthTokenCache = {};
        }
        
        // Check if we have a cached token
        const cacheKey = `${schemeName}_${clientId}`;
        const cachedToken = global.__oauthTokenCache[cacheKey];
        const now = Date.now();
        
        if (cachedToken && cachedToken.expiresAt > now) {
            console.error(`Using cached OAuth2 token for '${schemeName}' (expires in ${Math.floor((cachedToken.expiresAt - now) / 1000)} seconds)`);
            return cachedToken.token;
        }
        
        // Determine token URL based on flow type
        let tokenUrl = '';
        if (scheme.flows?.clientCredentials?.tokenUrl) {
            tokenUrl = scheme.flows.clientCredentials.tokenUrl;
            console.error(`Using client credentials flow for '${schemeName}'`);
        } else if (scheme.flows?.password?.tokenUrl) {
            tokenUrl = scheme.flows.password.tokenUrl;
            console.error(`Using password flow for '${schemeName}'`);
        } else {
            console.error(`No supported OAuth2 flow found for '${schemeName}'`);
            return null;
        }
        
        // Prepare the token request
        let formData = new URLSearchParams();
        formData.append('grant_type', 'client_credentials');
        
        // Add scopes if specified
        if (scopes) {
            formData.append('scope', scopes);
        }

        console.error(`Requesting OAuth2 token from ${tokenUrl}`);

        // Make the token request
        const response = await axios({
            method: 'POST',
            url: tokenUrl,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
            },
            data: formData.toString()
        });
        
        // Process the response
        if (response.data?.access_token) {
            const token = response.data.access_token;
            const expiresIn = response.data.expires_in || 3600; // Default to 1 hour
            
            // Cache the token
            global.__oauthTokenCache[cacheKey] = {
                token,
                expiresAt: now + (expiresIn * 1000) - 60000 // Expire 1 minute early
            };
            
            console.error(`Successfully acquired OAuth2 token for '${schemeName}' (expires in ${expiresIn} seconds)`);
            return token;
        } else {
            console.error(`Failed to acquire OAuth2 token for '${schemeName}': No access_token in response`);
            return null;
        }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Error acquiring OAuth2 token for '${schemeName}':`, errorMessage);
        return null;
    }
}


/**
 * Executes an API tool with the provided arguments
 * 
 * @param toolName Name of the tool to execute
 * @param definition Tool definition
 * @param toolArgs Arguments provided by the user
 * @param allSecuritySchemes Security schemes from the OpenAPI spec
 * @returns Call tool result
 */
async function executeApiTool(
    toolName: string,
    definition: McpToolDefinition,
    toolArgs: JsonObject,
    allSecuritySchemes: Record<string, any>
): Promise<CallToolResult> {
  try {
    // Validate arguments against the input schema
    let validatedArgs: JsonObject;
    try {
        const zodSchema = getZodSchemaFromJsonSchema(definition.inputSchema, toolName);
        const argsToParse = (typeof toolArgs === 'object' && toolArgs !== null) ? toolArgs : {};
        validatedArgs = zodSchema.parse(argsToParse);
    } catch (error: unknown) {
        if (error instanceof ZodError) {
            const validationErrorMessage = `Invalid arguments for tool '${toolName}': ${error.errors.map(e => `${e.path.join('.')} (${e.code}): ${e.message}`).join(', ')}`;
            return { content: [{ type: 'text', text: validationErrorMessage }] };
        } else {
             const errorMessage = error instanceof Error ? error.message : String(error);
             return { content: [{ type: 'text', text: `Internal error during validation setup: ${errorMessage}` }] };
        }
    }

    // Prepare URL, query parameters, headers, and request body
    let urlPath = definition.pathTemplate;
    const queryParams: Record<string, any> = {};
    const headers: Record<string, string> = { 'Accept': 'application/json' };
    let requestBodyData: any = undefined;

    // Apply parameters to the URL path, query, or headers
    definition.executionParameters.forEach((param) => {
        const value = validatedArgs[param.name];
        if (typeof value !== 'undefined' && value !== null) {
            if (param.in === 'path') {
                urlPath = urlPath.replace(`{${param.name}}`, encodeURIComponent(String(value)));
            }
            else if (param.in === 'query') {
                queryParams[param.name] = value;
            }
            else if (param.in === 'header') {
                headers[param.name.toLowerCase()] = String(value);
            }
        }
    });

    // Ensure all path parameters are resolved
    if (urlPath.includes('{')) {
        throw new Error(`Failed to resolve path parameters: ${urlPath}`);
    }
    
    // Construct the full URL
    const requestUrl = API_BASE_URL ? `${API_BASE_URL}${urlPath}` : urlPath;

    // Handle request body if needed
    if (definition.requestBodyContentType && typeof validatedArgs['requestBody'] !== 'undefined') {
        requestBodyData = validatedArgs['requestBody'];
        headers['content-type'] = definition.requestBodyContentType;
    }

    // Apply security requirements if available
    // Security requirements use OR between array items and AND within each object
    const appliedSecurity = definition.securityRequirements?.find(req => {
        // Try each security requirement (combined with OR)
        return Object.entries(req).every(([schemeName, scopesArray]) => {
            const scheme = allSecuritySchemes[schemeName];
            if (!scheme) return false;
            
            // API Key security (header, query, cookie)
            if (scheme.type === 'apiKey') {
                return !!process.env[`API_KEY_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];
            }
            
            // HTTP security (basic, bearer)
            if (scheme.type === 'http') {
                if (scheme.scheme?.toLowerCase() === 'bearer') {
                    return !!process.env[`BEARER_TOKEN_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];
                }
                else if (scheme.scheme?.toLowerCase() === 'basic') {
                    // Username is sufficient; an empty password is valid per RFC 7617 (issue #66)
                    return process.env[`BASIC_USERNAME_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`] != null;
                }
            }
            
            // OAuth2 security
            if (scheme.type === 'oauth2') {
                // Check for pre-existing token
                if (process.env[`OAUTH_TOKEN_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`]) {
                    return true;
                }
                
                // Check for client credentials for auto-acquisition
                if (process.env[`OAUTH_CLIENT_ID_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`] &&
                    process.env[`OAUTH_CLIENT_SECRET_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`]) {
                    // Verify we have a supported flow
                    if (scheme.flows?.clientCredentials || scheme.flows?.password) {
                        return true;
                    }
                }
                
                return false;
            }
            
            // OpenID Connect
            if (scheme.type === 'openIdConnect') {
                return !!process.env[`OPENID_TOKEN_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];
            }
            
            return false;
        });
    });

    // If we found matching security scheme(s), apply them
    if (appliedSecurity) {
        // Apply each security scheme from this requirement (combined with AND)
        for (const [schemeName, scopesArray] of Object.entries(appliedSecurity)) {
            const scheme = allSecuritySchemes[schemeName];
            
            // API Key security
            if (scheme?.type === 'apiKey') {
                const apiKey = process.env[`API_KEY_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];
                if (apiKey) {
                    if (scheme.in === 'header') {
                        headers[scheme.name.toLowerCase()] = apiKey;
                        console.error(`Applied API key '${schemeName}' in header '${scheme.name}'`);
                    }
                    else if (scheme.in === 'query') {
                        queryParams[scheme.name] = apiKey;
                        console.error(`Applied API key '${schemeName}' in query parameter '${scheme.name}'`);
                    }
                    else if (scheme.in === 'cookie') {
                        // Add the cookie, preserving other cookies if they exist
                        headers['cookie'] = `${scheme.name}=${apiKey}${headers['cookie'] ? `; ${headers['cookie']}` : ''}`;
                        console.error(`Applied API key '${schemeName}' in cookie '${scheme.name}'`);
                    }
                }
            } 
            // HTTP security (Bearer or Basic)
            else if (scheme?.type === 'http') {
                if (scheme.scheme?.toLowerCase() === 'bearer') {
                    const token = process.env[`BEARER_TOKEN_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];
                    if (token) {
                        headers['authorization'] = `Bearer ${token}`;
                        console.error(`Applied Bearer token for '${schemeName}'`);
                    }
                } 
                else if (scheme.scheme?.toLowerCase() === 'basic') {
                    const username = process.env[`BASIC_USERNAME_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];
                    const password = process.env[`BASIC_PASSWORD_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];
                    // Empty password is valid per RFC 7617 (issue #66); only username is required.
                    if (username != null) {
                        headers['authorization'] = `Basic ${Buffer.from(`${username}:${password ?? ''}`).toString('base64')}`;
                        console.error(`Applied Basic authentication for '${schemeName}'`);
                    }
                }
            }
            // OAuth2 security
            else if (scheme?.type === 'oauth2') {
                // First try to use a pre-provided token
                let token = process.env[`OAUTH_TOKEN_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];
                
                // If no token but we have client credentials, try to acquire a token
                if (!token && (scheme.flows?.clientCredentials || scheme.flows?.password)) {
                    console.error(`Attempting to acquire OAuth token for '${schemeName}'`);
                    token = (await acquireOAuth2Token(schemeName, scheme)) ?? '';
                }
                
                // Apply token if available
                if (token) {
                    headers['authorization'] = `Bearer ${token}`;
                    console.error(`Applied OAuth2 token for '${schemeName}'`);
                    
                    // List the scopes that were requested, if any
                    const scopes = scopesArray as string[];
                    if (scopes && scopes.length > 0) {
                        console.error(`Requested scopes: ${scopes.join(', ')}`);
                    }
                }
            }
            // OpenID Connect
            else if (scheme?.type === 'openIdConnect') {
                const token = process.env[`OPENID_TOKEN_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];
                if (token) {
                    headers['authorization'] = `Bearer ${token}`;
                    console.error(`Applied OpenID Connect token for '${schemeName}'`);
                    
                    // List the scopes that were requested, if any
                    const scopes = scopesArray as string[];
                    if (scopes && scopes.length > 0) {
                        console.error(`Requested scopes: ${scopes.join(', ')}`);
                    }
                }
            }
        }
    } 
    // Log warning if security is required but not available
    else if (definition.securityRequirements?.length > 0) {
        // First generate a more readable representation of the security requirements
        const securityRequirementsString = definition.securityRequirements
            .map(req => {
                const parts = Object.entries(req)
                    .map(([name, scopesArray]) => {
                        const scopes = scopesArray as string[];
                        if (scopes.length === 0) return name;
                        return `${name} (scopes: ${scopes.join(', ')})`;
                    })
                    .join(' AND ');
                return `[${parts}]`;
            })
            .join(' OR ');
            
        console.warn(`Tool '${toolName}' requires security: ${securityRequirementsString}, but no suitable credentials found.`);
    }
    

    // Prepare the axios request configuration
    const config: AxiosRequestConfig = {
      method: definition.method.toUpperCase(),
      url: requestUrl,
      params: queryParams,
      headers: headers,
      // Serialize array query params as comma-separated values (issue #41)
      paramsSerializer: (params: Record<string, any>) => {
        const search = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
          if (value === undefined || value === null) continue;
          search.append(key, Array.isArray(value) ? value.join(',') : String(value));
        }
        return search.toString();
      },
      ...(requestBodyData !== undefined && { data: requestBodyData }),
    };

    // Log request info to stderr (doesn't affect MCP output)
    console.error(`Executing tool "${toolName}": ${config.method} ${config.url}`);

    // Execute the request
    const response = await axios(config);

    // Process and format the response
    let responseText = '';
    // Coerce header value to string before lowercasing (issue #65)
    const contentType = String(response.headers['content-type'] ?? '').toLowerCase();
    
    // Handle JSON responses
    if (contentType.includes('application/json') && typeof response.data === 'object' && response.data !== null) {
         try { 
             responseText = JSON.stringify(response.data, null, 2); 
         } catch (e) { 
             responseText = "[Stringify Error]"; 
         }
    } 
    // Handle string responses
    else if (typeof response.data === 'string') { 
         responseText = response.data; 
    }
    // Handle other response types
    else if (response.data !== undefined && response.data !== null) { 
         responseText = String(response.data); 
    }
    // Handle empty responses
    else { 
         responseText = `(Status: ${response.status} - No body content)`; 
    }
    
    // Return formatted response
    return { 
        content: [ 
            { 
                type: "text", 
                text: `API Response (Status: ${response.status}):\n${responseText}` 
            } 
        ], 
    };

  } catch (error: unknown) {
    // Handle errors during execution
    let errorMessage: string;
    
    // Format Axios errors specially
    if (axios.isAxiosError(error)) { 
        errorMessage = formatApiError(error); 
    }
    // Handle standard errors
    else if (error instanceof Error) { 
        errorMessage = error.message; 
    }
    // Handle unexpected error types
    else { 
        errorMessage = 'Unexpected error: ' + String(error); 
    }
    
    // Log error to stderr
    console.error(`Error during execution of tool '${toolName}':`, errorMessage);
    
    // Return error message to client
    return { content: [{ type: "text", text: errorMessage }] };
  }
}


/**
 * Main function to start the server
 */
async function main() {
// Set up stdio transport
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error(`${SERVER_NAME} MCP Server (v${SERVER_VERSION}) running on stdio${API_BASE_URL ? `, proxying API at ${API_BASE_URL}` : ''}`);
  } catch (error) {
    console.error("Error during server startup:", error);
    process.exit(1);
  }
}

/**
 * Cleanup function for graceful shutdown
 */
async function cleanup() {
    console.error("Shutting down MCP server...");
    process.exit(0);
}

// Register signal handlers
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Start the server
main().catch((error) => {
  console.error("Fatal error in main execution:", error);
  process.exit(1);
});

/**
 * Formats API errors for better readability
 * 
 * @param error Axios error
 * @returns Formatted error message
 */
function formatApiError(error: AxiosError): string {
    let message = 'API request failed.';
    if (error.response) {
        message = `API Error: Status ${error.response.status} (${error.response.statusText || 'Status text not available'}). `;
        const responseData = error.response.data;
        const MAX_LEN = 200;
        if (typeof responseData === 'string') { 
            message += `Response: ${responseData.substring(0, MAX_LEN)}${responseData.length > MAX_LEN ? '...' : ''}`; 
        }
        else if (responseData) { 
            try { 
                const jsonString = JSON.stringify(responseData); 
                message += `Response: ${jsonString.substring(0, MAX_LEN)}${jsonString.length > MAX_LEN ? '...' : ''}`; 
            } catch { 
                message += 'Response: [Could not serialize data]'; 
            } 
        }
        else { 
            message += 'No response body received.'; 
        }
    } else if (error.request) {
        message = 'API Network Error: No response received from server.';
        if (error.code) message += ` (Code: ${error.code})`;
    } else { 
        message += `API Request Setup Error: ${error.message}`; 
    }
    return message;
}

/**
 * Converts a JSON Schema to a Zod schema for runtime validation
 * 
 * @param jsonSchema JSON Schema
 * @param toolName Tool name for error reporting
 * @returns Zod schema
 */
function getZodSchemaFromJsonSchema(jsonSchema: any, toolName: string): z.ZodTypeAny {
    if (typeof jsonSchema !== 'object' || jsonSchema === null) { 
        return z.object({}).passthrough(); 
    }
    try {
        const zodSchemaString = jsonSchemaToZod(jsonSchema);
        const zodSchema = eval(zodSchemaString);
        if (typeof zodSchema?.parse !== 'function') { 
            throw new Error('Eval did not produce a valid Zod schema.'); 
        }
        return zodSchema as z.ZodTypeAny;
    } catch (err: any) {
        console.error(`Failed to generate/evaluate Zod schema for '${toolName}':`, err);
        return z.object({}).passthrough();
    }
}
