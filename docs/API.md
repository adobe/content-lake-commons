## Classes

<dl>
<dt><a href="#ContextHelper">ContextHelper</a></dt>
<dd><p>A helper for working with the Franklin Universal context</p>
</dd>
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
<dt><del><a href="#extractAwsConfig">extractAwsConfig()</a></del></dt>
<dd></dd>
<dt><del><a href="#getLog">getLog()</a></del></dt>
<dd></dd>
<dt><del><a href="#extractOriginalEvent">extractOriginalEvent()</a></del></dt>
<dd></dd>
<dt><del><a href="#extractSqsRecords">extractSqsRecords()</a></del></dt>
<dd></dd>
<dt><a href="#Security.">Security.(allowedPermissions, actualPermissions)</a> ⇒ <code>boolean</code></dt>
<dd><p>Checks to see if any of the allowed permissions are present in the actual permissions,
using globbing expansion</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#BlobStorageConfig">BlobStorageConfig</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#AwsCredentials">AwsCredentials</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#AwsConfig">AwsConfig</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#Logger">Logger</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#UniversalishContext">UniversalishContext</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#RetryConfig">RetryConfig</a></dt>
<dd></dd>
<dt><a href="#QueueConfig">QueueConfig</a> : <code><a href="#AwsConfig">AwsConfig</a></code> | <code>QueueConfigExt</code></dt>
<dd></dd>
<dt><a href="#QueueRecord">QueueRecord</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#SecurityConfig">SecurityConfig</a></dt>
<dd></dd>
<dt><a href="#Handler">Handler</a> ⇒ <code>Promise.&lt;Response&gt;</code></dt>
<dd><p>Function for handling a routes inside Franklin / Content Lake services</p>
</dd>
<dt><a href="#SecretConfig">SecretConfig</a> : <code><a href="#AwsConfig">AwsConfig</a></code> | <code>SecretConfigExt</code></dt>
<dd></dd>
<dt><a href="#AuthenticationRequirement">AuthenticationRequirement</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#TokenRequest">TokenRequest</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#TokenPayload">TokenPayload</a> : <code>Object</code></dt>
<dd></dd>
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

## ~~extractAwsConfig()~~
***Deprecated***

**Kind**: global function  
<a name="getLog"></a>

## ~~getLog()~~
***Deprecated***

**Kind**: global function  
<a name="extractOriginalEvent"></a>

## ~~extractOriginalEvent()~~
***Deprecated***

**Kind**: global function  
<a name="extractSqsRecords"></a>

## ~~extractSqsRecords()~~
***Deprecated***

**Kind**: global function  
<a name="Security."></a>

## Security.(allowedPermissions, actualPermissions) ⇒ <code>boolean</code>
Checks to see if any of the allowed permissions are present in the actual permissions,
using globbing expansion

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| allowedPermissions | <code>Array.&lt;string&gt;</code> | the list of permissions which are allowed |
| actualPermissions | <code>Array.&lt;string&gt;</code> | the actual permissions from the request |

<a name="BlobStorageConfig"></a>

## BlobStorageConfig : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| bucket | <code>string</code> | 
| [client] | <code>S3</code> | 

<a name="AwsCredentials"></a>

## AwsCredentials : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| accessKeyId | <code>string</code> | 
| secretAccessKey | <code>string</code> | 
| [sessionToken] | <code>string</code> | 

<a name="AwsConfig"></a>

## AwsConfig : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| credentials | [<code>AwsCredentials</code>](#AwsCredentials) | 
| region | <code>string</code> | 

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

<a name="UniversalishContext"></a>

## UniversalishContext : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| [env] | <code>Record.&lt;string, string&gt;</code> | 
| [func] | <code>Object</code> | 
| [log] | [<code>Logger</code>](#Logger) | 
| [invocation] | <code>Object</code> | 

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

## QueueConfig : [<code>AwsConfig</code>](#AwsConfig) \| <code>QueueConfigExt</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| [blobStorage] | <code>BlobStorage</code> | 
| [client] | <code>SQSClient</code> | 
| [log] | [<code>Logger</code>](#Logger) | 
| queueUrl | <code>string</code> | 

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

<a name="SecurityConfig"></a>

## SecurityConfig
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| authRequired; | <code>boolean</code> | 
| [allowedRoles] | <code>Array.&lt;string&gt;</code> | 
| [allowedPermissions] | <code>Array.&lt;string&gt;</code> | 

<a name="Handler"></a>

## Handler ⇒ <code>Promise.&lt;Response&gt;</code>
Function for handling a routes inside Franklin / Content Lake services

**Kind**: global typedef  
**Returns**: <code>Promise.&lt;Response&gt;</code> - the response from the request  

| Param | Type | Description |
| --- | --- | --- |
| params | <code>Record.&lt;string, string&gt;</code> | the parameters parsed from the request |
| info | <code>Object</code> | the   additional request information |

<a name="SecretConfig"></a>

## SecretConfig : [<code>AwsConfig</code>](#AwsConfig) \| <code>SecretConfigExt</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| [client] | <code>SecretsManagerClient</code> | 
| application | <code>string</code> | 
| [companyId] | <code>string</code> | 
| [scope] | <code>string</code> | 

<a name="AuthenticationRequirement"></a>

## AuthenticationRequirement : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| [allowedRoles] | <code>Array.&lt;string&gt;</code> | 
| [allowedPermissions] | <code>Array.&lt;string&gt;</code> | 

<a name="TokenRequest"></a>

## TokenRequest : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| spaceId | <code>string</code> | the space for which the token will be generated |
| roleKeys | <code>Array.&lt;string&gt;</code> | the role keys for which the token should be generated |
| generator | <code>string</code> | provides attribution for the key in the description |
| [expiresInMinutes] | <code>number</code> | the number of minutes before the token expires (or 14 days) |

<a name="TokenPayload"></a>

## TokenPayload : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| permissions | <code>Array.&lt;string&gt;</code> | the permissions granted to this token |
| roles | <code>Array.&lt;string&gt;</code> | the permissions granted to this token |
| sub | <code>string</code> | the subject (or identifier) for this token |
| tenantId | <code>string</code> | the primary tenant for the token |
| [tenantIds] | <code>Array.&lt;string&gt;</code> | the optional list of additional  allowed tenants for the token |
| type | <code>string</code> | the type of the token |
| exp | <code>number</code> | the timestamp at which the token will expire |

