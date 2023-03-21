## Classes

<dl>
<dt><a href="#FetchRetry">FetchRetry</a></dt>
<dd><p>Support for retriable requests</p>
</dd>
<dt><a href="#SchemaValidator">SchemaValidator</a></dt>
<dd><p>Loads schemas from this project in the <code>schemas</code> directory and supports validating
objects against the schemas.</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#extractAwsConfig">extractAwsConfig(context)</a> ⇒</dt>
<dd><p>Loads the configuration keys from an environment variable map</p>
</dd>
<dt><a href="#getLog">getLog(context)</a> ⇒ <code><a href="#Logger">Logger</a></code></dt>
<dd><p>Get the logger from the context or return the console</p>
</dd>
<dt><a href="#extractOriginalEvent">extractOriginalEvent(context)</a> ⇒ <code>any</code></dt>
<dd><p>Gets the original event that triggered the Lambda</p>
</dd>
<dt><a href="#extractSqsRecords">extractSqsRecords(context)</a> ⇒ <code><a href="#QueueRecord">Array.&lt;QueueRecord&gt;</a></code></dt>
<dd><p>Gets the SQS records from the context</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#UniversalishContext">UniversalishContext</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#QueueRecord">QueueRecord</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#Logger">Logger</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#RetryConfig">RetryConfig</a></dt>
<dd></dd>
<dt><a href="#QueueConfig">QueueConfig</a></dt>
<dd></dd>
<dt><a href="#Handler">Handler</a> ⇒ <code>Promise.&lt;Response&gt;</code></dt>
<dd><p>Function for handling a routes inside Frankin / Content Lake services</p>
</dd>
</dl>

<a name="SchemaValidator"></a>

## SchemaValidator
Loads schemas from this project in the <code>schemas</code> directory and supports validating
objects against the schemas.

**Kind**: global class  
<a name="SchemaValidator+validateIngestionRequest"></a>

### schemaValidator.validateIngestionRequest(ingestionRequest, additionalRequiredData)
Validates the <code>ingestionRequest</code> object against the Ingestion Request schema
as specified in https://wiki.corp.adobe.com/display/WEM/Ingestor+API+Contract

**Kind**: instance method of [<code>SchemaValidator</code>](#SchemaValidator)  
**See**: https://wiki.corp.adobe.com/display/WEM/Ingestor+API+Contract?  

| Param | Type |
| --- | --- |
| ingestionRequest | <code>any</code> | 
| additionalRequiredData | <code>Array.&lt;string&gt;</code> | 

<a name="extractAwsConfig"></a>

## extractAwsConfig(context) ⇒
Loads the configuration keys from an environment variable map

**Kind**: global function  
**Returns**: the configuration to use for providing credentials to AWS clients  

| Param | Type | Description |
| --- | --- | --- |
| context | [<code>UniversalishContext</code>](#UniversalishContext) | the context from which to retrieve      environment variables map |

<a name="getLog"></a>

## getLog(context) ⇒ [<code>Logger</code>](#Logger)
Get the logger from the context or return the console

**Kind**: global function  

| Param | Type |
| --- | --- |
| context | [<code>UniversalishContext</code>](#UniversalishContext) | 

<a name="extractOriginalEvent"></a>

## extractOriginalEvent(context) ⇒ <code>any</code>
Gets the original event that triggered the Lambda

**Kind**: global function  
**Returns**: <code>any</code> - the original invocation event for the Lambda  

| Param | Type |
| --- | --- |
| context | [<code>UniversalishContext</code>](#UniversalishContext) | 

<a name="extractSqsRecords"></a>

## extractSqsRecords(context) ⇒ [<code>Array.&lt;QueueRecord&gt;</code>](#QueueRecord)
Gets the SQS records from the context

**Kind**: global function  
**Returns**: [<code>Array.&lt;QueueRecord&gt;</code>](#QueueRecord) - the SQS record payload  

| Param | Type |
| --- | --- |
| context | [<code>UniversalishContext</code>](#UniversalishContext) | 

<a name="UniversalishContext"></a>

## UniversalishContext : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| env | <code>Record.&lt;string, string&gt;</code> | 
| log | [<code>Logger</code>](#Logger) | 
| [invocation] | <code>Object</code> | 

<a name="QueueRecord"></a>

## QueueRecord : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| messageId | <code>string</code> | 
| receiptHandle | <code>string</code> | 
| body | <code>string</code> | 
| attributes | <code>Record.&lt;string, any&gt;</code> | 
| messageAttributes | <code>Record.&lt;string, any&gt;</code> | 
| eventSource | <code>string</code> | 
| eventSourceARN | <code>string</code> | 

<a name="Logger"></a>

## Logger : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| debug | <code>function</code> | 
| info | <code>function</code> | 
| warn | <code>function</code> | 
| error | <code>function</code> | 

<a name="RetryConfig"></a>

## RetryConfig
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| [retries] | <code>number</code> | 
| [retryOn] | <code>Array.&lt;number&gt;</code> | 
| [log] | <code>any</code> | 

<a name="QueueConfig"></a>

## QueueConfig
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| [client] | <code>SQSClient</code> | 
| credentials | <code>Object</code> | 
| credentials.accessKeyId | <code>string</code> | 
| credentials.secretAccessKey | <code>string</code> | 
| [logger] | <code>\*</code> | 
| queueUrl | <code>string</code> | 
| [region] | <code>string</code> | 

<a name="Handler"></a>

## Handler ⇒ <code>Promise.&lt;Response&gt;</code>
Function for handling a routes inside Frankin / Content Lake services

**Kind**: global typedef  
**Returns**: <code>Promise.&lt;Response&gt;</code> - the response from the request  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Request</code> | the request |
| context | <code>UniversalContext</code> | the context of the request |
| params | <code>Record.&lt;string, string&gt;</code> | the parameters parsed from the request |

