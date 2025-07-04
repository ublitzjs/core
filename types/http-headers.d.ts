import type { HttpResponse } from "./index";
import type { HttpResponse as uwsHttpResponse } from "uWebSockets.js";
type helmetHeadersT = {
  /**
   *  By adding this header you can declare that your site should only load resources that have explicitly opted-in to being loaded across origins.
   * "require-corp" LETS YOU USE new SharedArrayBuffer()
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cross-Origin-Embedder-Policy
   */
  "Cross-Origin-Embedder-Policy":
    | "unsafe-none"
    | "require-corp"
    | "credentialless";
  /**
   * whether new page opened via Window.open() should be treated differently for performance reasons
   * @see   https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cross-Origin-Opener-Policy
   */
  "Cross-Origin-Opener-Policy":
    | "unsafe-none"
    | "same-origin-allow-popups"
    | "same-origin"
    | "noopener-allow-popups";
  /**
   * From where should client fetch resources
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cross-Origin-Resource-Policy
   */
  "Cross-Origin-Resource-Policy": "same-site" | "same-origin" | "cross-origin";
  /**
   * if client fetched resource, but its MIME type is different - abort request
   */
  "X-Content-Type-Options": "nosniff";
  /**
   * Safari doesn't support it
   */
  "X-DNS-Prefetch-Control": "on" | "off";
  /**
   * Sites can use this to avoid clickjacking (<iframe> html tag)
   */
  "X-Frame-Options": "DENY" | "SAMEORIGIN";
  /**
   * whether you need info about client.
   */
  "Referrer-Policy":
    | "no-referrer"
    | "no-referrer-when-downgrade"
    | "origin"
    | "origin-when-cross-origin"
    | "same-origin"
    | "strict-origin"
    | "strict-origin-when-cross-origin"
    | "unsafe-url";
  /**
   * usually for Adobe Acrobat or Microsoft Silverlight.
   */
  "X-Permitted-Cross-Domain-Policies":
    | "none"
    | "master-only"
    | "by-content-type"
    | "by-ftp-filename"
    | "all"
    | "none-this-response";
  /**
   * Whether downloaded files should be run on the client side immediately. For IE8
   */
  "X-Download-Options": "noopen";

  /**
   * similar to COOP, where ?1 is true
   */
  "Origin-Agent-Cluster": "?0" | "?1";
  /**
   *@deprecated
   * */
  "X-XSS-Protection": string;
};
type CORSHeader = {
  /**
   * The HTTP Access-Control-Allow-Credentials response header tells browsers whether the server allows credentials to be included in cross-origin HTTP requests.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Access-Control-Allow-Credentials
   */
  "Access-Control-Allow-Credentials": "true" | "false";
  /**
   * Allowed headers in the request.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Access-Control-Allow-Headers
   */
  "Access-Control-Allow-Headers": string;
  /**
   * CORS version of Allow header
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Access-Control-Allow-Methods
   */
  "Access-Control-Allow-Methods": string;
  /**
   * Allowed origins to get the resource. * - all, https://example.com - some website.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Access-Control-Allow-Origin
   */
  "Access-Control-Allow-Origin": string;
  /**
   * The HTTP Access-Control-Expose-Headers response header allows a server to indicate which response headers should be made available to scripts running in the browser in response to a cross-origin request.

   * Only the CORS-safelisted response headers are exposed by default. For clients to be able to access other headers, the server must list them using the Access-Control-Expose-Headers header.
  @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Access-Control-Expose-Headers
 */
  "Access-Control-Expose-Headers": string;
  /**
   * The HTTP Access-Control-Max-Age response header indicates how long the results of a preflight request (that is, the information contained in the Access-Control-Allow-Methods and Access-Control-Allow-Headers headers) can be cached.
   * @example "600"
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Access-Control-Max-Age
   */
  "Access-Control-Max-Age": string;
  /**
   * The HTTP Access-Control-Request-Headers request header is used by browsers when issuing a preflight request to let the server know which HTTP headers the client might send when the actual request is made (such as with fetch() or XMLHttpRequest.setRequestHeader()).
   *
   *  The complementary server-side header of Access-Control-Allow-Headers will answer this browser-side header.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Access-Control-Request-Headers
   */
  "Access-Control-Request-Headers": string;
  /**
   * The HTTP Access-Control-Request-Method request header is used by browsers when issuing a preflight request to let the server know which HTTP method will be used when the actual request is made. This header is necessary because the preflight request is always an OPTIONS and doesn't use the same method as the actual request.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Access-Control-Request-Method
   */
  "Access-Control-Request-Method": string;
};
type experimentalHeaders = {
  /**
   * @experimental
   * The HTTP Attribution-Reporting-Eligible request header indicates that the corresponding response is eligible to register an attribution source or trigger.

This header is never set manually and is instead sent by the browser in response to various HTML element or JavaScript request settings.

Depending on the allowed registrations specified in the Attribution-Reporting-Eligible value, the server is expected to respond with either an Attribution-Reporting-Register-Source or Attribution-Reporting-Register-Trigger header to complete the registration of an attribution source or trigger, respectively.
@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Attribution-Reporting-Eligible
   */
  "Attribution-Reporting-Eligible": string;
  /**
   * @experimental
   * The HTTP Attribution-Reporting-Register-Source response header registers a page feature as an attribution source.
   *
   * This header is included as part of a response to a request that contains the Attribution-Reporting-Eligible header.
   *
   * It provides the information that the browser should store when a user interacts with the attribution source.
   *
   * The information you include in this header also determines the types of reports the browser can generate.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Attribution-Reporting-Register-Source
   */
  "Attribution-Reporting-Register-Source": string;
  /**
   * @experimental
   * The HTTP Attribution-Reporting-Register-Trigger response header registers a page feature as an attribution trigger.
   *
   * This header is included as part of a response to a request that contains the Attribution-Reporting-Eligible header.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Attribution-Reporting-Register-Trigger
   */
  "Attribution-Reporting-Register-Trigger": string;
  /**
   * @experimental
   * The HTTP Available-Dictionary request header allows the browser to specify the best matching dictionary it has to allow the server to use Compression Dictionary Transport for a resource request.

Clients can send an Available-Dictionary header when they support dcb or dcz encodings. 

The header is a colon-surrounded base-64 encoded SHA-256 hash of the dictionary contents.
@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Available-Dictionary
   */
  "Available-Dictionary": string;
  /**
   * @experimental
   * The HTTP Critical-CH response header is used along with Accept-CH to identify the accepted client hints that are critical.

User agents receiving a response with Critical-CH must check if the indicated critical headers were sent in the original request. 

If not, the user agent will retry the request along with the critical headers rather than render the page. 

This approach ensures that client preferences set using critical client hints are always used, even if not included in the first request, or following server configuration changes.

Each header listed in the Critical-CH header should also be present in the Accept-CH and Vary headers.
@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Critical-CH
   */
  "Critical-CH": string;
  /**
   * @experimental
   * The HTTP Dictionary-ID request header references a dictionary that can be used in Compression Dictionary Transport to compress the server's response.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Dictionary-ID
   **/
  "Dictionary-ID": string;
  /**
   * @experimental10
   * The HTTP Device-Memory request header is used in device client hints to indicate the approximate amount of available RAM on the client device, in gigabytes. The header is part of the Device Memory API.

Client hints are accessible only on secure origins.

A server has to opt in to receive the Device-Memory header from the client, by first sending the Accept-CH response header. 

Servers that opt in to the Device-Memory client hint will typically also specify it in the Vary header to inform caches that the server may send different responses based on the header value in a request.
@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Device-Memory
   */
  "Device-Memory": string;
  /**
   * @deprecated
   * @experimental
   * The HTTP DNT (Do Not Track) request header indicates the user's tracking preference.
   *
   * It lets users indicate whether they would prefer privacy rather than personalized content.

DNT is deprecated in favor of Global Privacy Control, which is communicated to servers using the Sec-GPC header, and accessible to clients from navigator.globalPrivacyControl.
@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/DNT
   **/
  DNT: string;
  /**
   * The HTTP Downlink request header is used in Client Hints to provide the approximate bandwidth in Mbps of the client's connection to the server.

The hint allows a server to choose what information is sent based on the network bandwidth.

For example, a server might choose to send smaller versions of images and other resources on low bandwidth networks.
@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Downlink
   **/
  Downlink: string;
  /**
   * @deprecated
   * The HTTP DPR request header provides device client hints about the client device pixel ratio (DPR). This ratio is the number of physical device pixels corresponding to every CSS pixel.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/DPR
   **/
  DPR: string;
  /**
   * @experimental
   * The HTTP Early-Data request header is set by an intermediary to indicate that the request has been conveyed in TLS early data, and also indicates that the intermediary understands the 425 Too Early status code.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Early-Data
   * */
  "Early-Data": string;
  /**
   * @experimental
   *The HTTP ECT request header is used in Client Hints to indicate the effective connection type: slow-2g, 2g, 3g, or 4g.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/ECT
   * */
  ECT: string;
  /**
   * @experimental
   * The HTTP NEL response header is used to configure network request logging.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/NEL
   * */
  NEL: string;
  /**
  *@experimental
  The HTTP No-Vary-Search response header specifies a set of rules that define how a URL's query parameters will affect cache matching.

  These rules dictate whether the same URL with different URL parameters should be saved as separate browser cache entries.A
  @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/No-Vary-Search
  * */
  "No-Vary-Search": string;
  /**
   *@experimental
   * The HTTP Observe-Browsing-Topics response header is used to mark topics of interest inferred from a calling site's URL (i.e., the site where the ad tech <iframe> is embedded) as observed in the response to a request generated by a feature that enables the Topics API. The browser will subsequently use those topics to calculate top topics for the current user for future epochs.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Observe-Browsing-Topics
   * */
  "Observe-Browsing-Topics": string;
  /**
   * @experimental
  *The HTTP Permissions-Policy response header provides a mechanism to allow and deny the use of browser features in a document or within any <iframe> elements in the document.
  @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Permissions-Policy
  * */
  "Permissions-Policy": string;
  /**
  *@experimental
@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/RTT
  * */
  RTT: string;
  /**
 *@experimental
 @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/RTT
 * */
  "Save-Data": string;
  /**
 *@experimental
 @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-Browsing-Topics
 * */
  "Sec-Browsing-Topics": string;
  /**
 *@experimental
 @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-CH-Prefers-Color-Scheme
 * */
  "Sec-CH-Prefers-Color-Scheme": string;
  /**
   * @experimental
   *@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-CH-Prefers-Reduced-Motion
   * */
  "Sec-CH-Prefers-Reduced-Motion": string;
  /**
 *@experimental
 @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-CH-Prefers-Reduced-Transparency
 * */
  "Sec-CH-Prefers-Reduced-Transparency": string;
  /**
  *@experimental
  @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-CH-UA
  * */
  "Sec-CH-UA": string;
  /**
   * @experimental
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-CH-UA-Arch
   * */
  "Sec-CH-UA-Arch": string;
  /**
   * @experimental
   *@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-CH-UA-Bitness
   * */
  "Sec-CH-UA-Bitness": string;
  /**
  *@experimental
  @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-CH-UA-Form-Factors
  * */
  "Sec-CH-UA-Form-Factors": string;
  /**
  *@deprecated 
  @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-CH-UA-Full-Version
  * */
  "Sec-CH-UA-Full-Version": string;
  /**
  *@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-CH-UA-Full-Version-List
  @experimental
  * */
  "Sec-CH-UA-Full-Version-List": string;
  /**
  *@experimental
  @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-CH-UA-Mobile
  * */
  "Sec-CH-UA-Mobile": string;
  /**
  *@experimental
  @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-CH-UA-Model
  * */
  "Sec-CH-UA-Model": string;
  /**
    *@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-CH-UA-Platform
    @experimental
    * */
  "Sec-CH-UA-Platform": string;
  /**
    *@experimental
    @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-CH-UA-Platform-Version
    * */
  "Sec-CH-UA-Platform-Version": string;

  /**
    *@experimental
    @see  https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-CH-UA-WoW64
    * */
  "Sec-CH-UA-WoW64": string;
  /**
  *@experimental
  @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-GPC
  * */
  "Sec-GPC": string;
  /**
 *@experimental
 @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-Speculation-Tags
 * */
  "Sec-Speculation-Tags": string;
  /**
  *@experimental
  @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-Purpose
  * */
  "Sec-Purpose": string;
  /**
 * @experimental
*@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Speculation-Rules
The HTTP Speculation-Rules response header provides one or more URLs pointing to text resources containing speculation rule JSON definitions. When the response is an HTML document, these rules will be added to the document's speculation rule set. See the Speculation Rules API for more information.
* */
  "Speculation-Rules": string;
  /**
   * @experimental
   *@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Supports-Loading-Mode
   * */
  "Supports-Loading-Mode": string;
  /**
   * @experimental
   *@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Use-As-Dictionary
   * */
  "Use-As-Dictionary": string;
};
type simpleHeaders = {
  /**
   * indicates which content types, expressed as MIME types, the sender is able to understand
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Accept
   */
  Accept: string;
  /**
   * The HTTP Accept-CH response header may be set by a server to specify which client hint headers should be included by the client in subsequent requests. To ensure client hints are sent reliably, the Accept-CH header should be persisted for all secure requests.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Accept-CH
   */
  "Accept-CH": string;
  /**
   * The HTTP Accept-Encoding request and response header indicates the content encoding (usually a compression algorithm) that the sender can understand.
   *
   * In requests, the server uses content negotiation to select one of the encoding proposals from the client and informs the client of that choice with the Content-Encoding response header.
   *
   * In responses, it provides information about which content encodings the server can understand in messages to the requested resource, so that the encoding can be used in subsequent requests to the resource.
   *
   * For example, Accept-Encoding is included in a 415 Unsupported Media Type response if a request to a resource (e.g., PUT) used an unsupported encoding.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Accept-Encoding
   */
  "Accept-Encoding": string;
  /**
   * The HTTP Accept-Language request header indicates the natural language and locale that the client prefers.\
   *  The server uses content negotiation to select one of the proposals and informs the client of the choice with the Content-Language response header.
   *
   * Browsers set required values for this header according to their active user interface language.\
   *  Users can also configure additional preferred languages through browser settings.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Accept-Language
   */
  "Accept-Language": string;
  /**
   * The HTTP Accept-Patch response header advertises which media types the server is able to understand in a PATCH request. For example, a server receiving a PATCH request with an unsupported media type could reply with 415 Unsupported Media Type and an Accept-Patch header referencing one or more supported media types.

   * The header should appear in OPTIONS requests to a resource that supports the PATCH method. An Accept-Patch header in a response to any request method implicitly means that a PATCH is allowed on the target resource in the request.
@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Accept-Patch
   */
  "Accept-Patch": string;
  /**
   * The HTTP Accept-Post response header advertises which media types are accepted by the server in a POST request. For example, a server receiving a POST request with an unsupported media type could reply with 415 Unsupported Media Type and an Accept-Post header referencing one or more supported media types.

   * The header should appear in OPTIONS requests to a resource that supports the POST method. An Accept-Post header in a response to any request method implicitly means that a POST is allowed on the target resource in the request.
   @example
  "application/json"
  "image/webp, text/plain"
  @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Accept-Post
   */
  "Accept-Post": string;
  /**
   * The HTTP Accept-Ranges response header is used by the server to advertise its support for range requests, allowing clients to request part or several parts of a resource. The value of this header indicates the unit that can be used to define a range.

   * For example, a response with an Accept-Ranges header indicates that the server is capable of resuming an interrupted download instead of a client restarting the transfer in full.
  @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Accept-Ranges
   */
  "Accept-Ranges": "bytes" | "none";
  /**
   * The HTTP Age response header indicates the time in seconds for which an object was in a proxy cache.

   * The header value is usually close to zero. If the value is 0, the object was probably fetched from the origin server; otherwise, the value is usually calculated as a difference between the proxy's current date and the Date general header included in the HTTP response.
   @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Age
   */
  Age: string;
  /**
   * The HTTP Allow response header lists the set of request methods supported by a resource.
   *
   * This header must be sent if the server responds with a 405 Method Not Allowed status code to indicate which request methods can be used instead.
   *
   *  An empty Allow value indicates that the resource allows no request methods, which might occur temporarily for a given resource.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Allow
   */
  Allow: string;
  /**
   * The HTTP Alt-Svc response header lets a server indicate that another network location (the "alternative service") can be treated as authoritative for that origin when making future requests.

Doing so allows new protocol versions to be advertised without affecting in-flight requests and can also help servers manage traffic. 

Using an alternative service is not visible to the end user; it does not change the URL or the origin of the request and does not introduce additional round trips.
@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Alt-Svc
   */
  "Alt-Svc": string;
  /**
   * The HTTP Alt-Used request header is used to identify the alternative service in use, just as the Host HTTP header field identifies the host and port of the origin.

The is intended to allow alternative services to detect loops, differentiate traffic for purposes of load balancing, and generally to ensure that it is possible to identify the intended destination of traffic, since introducing this information after a protocol is in use has proven to be problematic.

When a client uses an alternative service for a request, it can indicate this to the server using the Alt-Used HTTP header.
@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Alt-Used
   */
  "Alt-Used": string;
  /**
   * The HTTP Authorization request header can be used to provide credentials that authenticate a user agent with a server, allowing access to protected resources.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Authorization
   */
  Authorization: string;
  /**
   *The HTTP Cache-Control header holds directives (instructions) in both requests and responses that control caching in browsers and shared caches (e.g., Proxies, CDNs).
   @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control
   */
  "Cache-Control": string;
  /**
   * The HTTP Clear-Site-Data response header sends a signal to the client that it should remove all browsing data of certain types (cookies, storage, cache) associated with the requesting website.
   *
   * It allows web developers to have more control over the data stored by browsers for their origins.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Clear-Site-Data
   */
  "Clear-Site-Data": string;
  /**
   * The HTTP Connection header controls whether the network connection stays open after the current transaction finishes.
   *
   * If the value sent is keep-alive, the connection is persistent and not closed, allowing subsequent requests to the same server on the same connection.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Connection
   */
  Connection: string;
  /**
   * The HTTP Content-Digest request and response header provides a digest calculated using a hashing algorithm applied to the message content.
   *
   *  A recipient can use the Content-Digest to validate the HTTP message content for integrity purposes.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Digest
   */
  "Content-Digest": string;
  /**
   * The HTTP Content-Disposition header indicates whether content should be displayed inline in the browser as a web page or part of a web page or downloaded as an attachment locally.
   * 
   * In a multipart body, the header must be used on each subpart to provide information about its corresponding field. 
   * 
   * The subpart is delimited by the boundary defined in the Content-Type header. When used on the body itself, Content-Disposition has no effect.

The Content-Disposition header is defined in the larger context of MIME messages for email, but only a subset of the possible parameters apply to HTTP forms and POST requests. 

Only the value form-data, as well as the optional directive name and filename, can be used in the HTTP context.
@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Disposition
   */
  "Content-Disposition": string;
  /**
   * @deprecated
   * The HTTP Content-DPR response header is used to confirm the image device to pixel ratio (DPR) in requests where the screen DPR client hint was used to select an image resource.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-DPR
   */
  "Content-DPR": string;
  /**
   * The HTTP Content-Encoding representation header lists the encodings and the order in which they have been applied to a resource.
   *
   *  This lets the recipient know how to decode the data in order to obtain the original content format described in the Content-Type header.
   *
   *  Content encoding is mainly used to compress content without losing information about the original media type.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Encoding
   */
  "Content-Encoding": string;
  /**
   * The HTTP Content-Language representation header is used to describe the language(s) intended for the audience, so users can differentiate it according to their own preferred language.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Language
   */
  "Content-Language": string;
  /**
   * Length in bytes of content, you send or receive.
   * @type number. BUT here it is a string
   */
  "Content-Length": string;
  /**
   * The HTTP Content-Location representation header indicates an alternate location for the returned data.
   *
   *  It's main use is to indicate the URL of a resource transmitted as the result of content negotiation.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Location
   */
  "Content-Location": string;
  /**
   * The HTTP Content-Range response header is used in range requests to indicate where the content of a response body belongs in relation to a complete resource.

It should only be included in 206 Partial Content or 416 Range Not Satisfiable responses.
@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Range
   */
  "Content-Range": string;
  /**
   * The HTTP Content-Security-Policy response header allows website administrators to control resources the user agent is allowed to load for a given page.
   *
   * With a few exceptions, policies mostly involve specifying server origins and script endpoints. This helps guard against cross-site scripting attacks.
   *
   * @use setCSP function
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy
   */
  "Content-Security-Policy": string;
  /**
   * The HTTP Content-Security-Policy-Report-Only response header helps to monitor Content Security Policy (CSP) violations and their effects without enforcing the security policies. 
   * 
   * This header allows you to test or repair violations before a specific Content-Security-Policy is applied and enforced.

The CSP report-to directive must be specified for reports to be sent: if not, the operation won't have any effect.
@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy-Report-Only
   */
  "Content-Security-Policy-Report-Only": string;
  /**
   * You know this one. It is "text/html" or "video/mp4" or whatever
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Type
   */
  "Content-Type": string;
  /**
   * The HTTP Cookie request header contains stored HTTP cookies associated with the server (i.e., previously sent by the server with the Set-Cookie header or set in JavaScript using Document.cookie)
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cookie
   */
  Cookie: string;
  /**
   * The HTTP Date request and response header contains the date and time at which the message originated.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Date
   */
  Date: string;

  /**
   * The HTTP ETag (entity tag) response header is an identifier for a specific version of a resource.
   *
   * It lets caches be more efficient and save bandwidth, as a web server does not need to resend a full response if the content has not changed.
   *
   * Additionally, ETags help to prevent simultaneous updates of a resource from overwriting each other ("mid-air collisions").
   * If the resource at a given URL changes, a new Etag value must be generated. A comparison of them can determine whether two representations of a resource are the same.
   * @see
   * https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/ETag
   * */

  Etag: string;
  /**
   *The HTTP Expect request header indicates that there are expectations that need to be met by the server in order to handle the complete request successfully.

When a request has an Expect: 100-continue header, a server sends a 100 Continue response to indicate that the server is ready or capable of receiving the rest of the request content. Waiting for a 100 response can be helpful if a client anticipates that an error is likely, for example, when sending state-changing operations without previously verified authentication credentials.

A 417 Expectation Failed response is returned if the server cannot meet the expectation, or any other status otherwise (e.g., a 4XX status for a client error, or a 2XX status if the request can be resolved successfully without further processing).

None of the more common browsers send the Expect header, but some clients (command-line tools) do so by default.
@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Expect
  * */
  Expect: string;
  /**
   * @deprecated
   * The Expect-CT response header lets sites opt in to reporting and/or enforcement of Certificate Transparency requirements. Certificate Transparency (CT) aims to prevent the use of misissued certificates for that site from going unnoticed.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Expect-CT
   * */
  "Expect-CT": string;
  /**
  *The HTTP Expires response header contains the date/time after which the response is considered expired in the context of HTTP caching.

The value 0 is used to represent a date in the past, indicating the resource has already expired.
@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Expires
  * */
  Expires: string;
  /**
   * The HTTP Forwarded request header contains information that may be added by reverse proxy servers (load balancers, CDNs, etc.) that would otherwise be altered or lost when proxy servers are involved in the path of the request.
   * 	@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Forwarded
   * */
  Forwared: string;
  /**
   * The HTTP From request header contains an Internet email address for an administrator who controls an automated user agent.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/From
   * */
  From: string;
  /**
   * The HTTP Host request header specifies the host and port number of the server to which the request is being sent.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Host
   * */
  Host: string;
  /**
   * The HTTP If-Match request header makes a request conditional. A server will return resources for GET and HEAD methods, or upload resource for PUT and other non-safe methods, only if the resource matches one of the ETag values in the If-Match request header. If the conditional does not match, the 412 Precondition Failed response is returned instead.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/If-Match
   * */
  "If-Match": string;
  /**
 * The HTTP If-Modified-Since request header makes a request conditional. The server sends back the requested resource, with a 200 status, only if it has been modified after the date in the If-Modified-Since header. If the resource has not been modified since, the response is a 304 without any body, and the Last-Modified response header of the previous request contains the date of the last modification.

Unlike If-Unmodified-Since, If-Modified-Since can only be used with a GET or HEAD. When used in combination with If-None-Match, it is ignored, unless the server doesn't support If-None-Match.

The most common use case is to update a cached entity that has no associated ETag.
@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/If-Modified-Since
 * */
  "If-Modified-Since": string;
  /**
*The HTTP If-None-Match request header makes a request conditional. The server returns the requested resource in GET and HEAD methods with a 200 status, only if it doesn't have an ETag matching the ones in the If-None-Match header. For other methods, the request will be processed only if the eventually existing resource's ETag doesn't match any of the values listed.
@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/If-None-Match
* */
  "If-None-Match": string;
  /**
   * The HTTP If-Range request header makes a range request conditional. If the condition is fulfilled, a range request is issued, and the server sends back a 206 Partial Content response with part (or parts) of the resource in the body. If the condition is not fulfilled, the full resource is sent back with a 200 OK status.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/If-Range
   * */
  "If-Range": string;
  /**
*The HTTP If-Unmodified-Since request header makes the request for the resource conditional. The server will send the requested resource (or accept it in the case of a POST or another non-safe method) only if the resource on the server has not been modified after the date in the request header. If the resource has been modified after the specified date, the response will be a 412 Precondition Failed error.
@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/If-Unmodified-Since
* */
  "If-Unmodified-Since": string;
  /**
*The HTTP Integrity-Policy response header allows website administrators to ensure that all resources the user agent loads (of a certain type) have Subresource Integrity guarantees.
@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Integrity-Policy
* */
  "Integrity-Policy": string;
  /**
   * The HTTP Integrity-Policy-Report-Only response header allows website administrators to report on resources that the user agent loads that would violate Subresource Integrity guarantees if the integrity policy was enforced (using the Integrity-Policy header).
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Integrity-Policy-Report-Only
   * */
  "Integrity-Policy-Report-Only": string;
  /**
*The HTTP Keep-Alive request and response header allows the sender to hint how a connection may be used in terms of a timeout and a maximum amount of requests.
@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Keep-Alive
* */
  "Keep-Alive": string;
  /**
   * https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Last-Modified
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Last-Modified
   * */
  "Last-Modified": string;
  /**
   * The HTTP Link header provides a means for serializing one or more links in HTTP headers.
   *
   * This allows the server to point a client to another resource containing metadata about the requested resource.
   *
   * This header has the same semantics as the HTML <link> element.
   *
   * One benefit of using the Link header is that the browser can start preconnecting or preloading resources before the HTML itself is fetched and processed.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Link
   * */
  Link: string;
  /**
*The HTTP Location response header indicates the URL to redirect a page to. It only provides a meaning when served with a 3XX redirection response or a 201 Created status response.
@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Location
* */
  Location: string;
  /**
*The HTTP Max-Forwards request header is used with the TRACE method to limit the number of nodes (usually proxies) that the request goes through.

Its value is an integer indicating the maximum amount of nodes it must visit.

At each node, the value is decremented and the TRACE request is forwarded to the next node until the destination is reached or the received value of Max-Forwards is zero.

The request is then sent back (excluding sensitive headers where appropriate) as the body of a 200 response.

This allows the client to see what is being received at the other end of the request chain (the Via header is of particular interest) for testing or diagnostic purposes.
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Max-Forwards
* */
  "Max-Forwards": string;
  /**
*The HTTP Origin request header indicates the origin (scheme, hostname, and port) that caused the request. For example, if a user agent needs to request resources included in a page, or fetched by scripts that it executes, then the origin of the page may be included in the request.
@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Origin
* */
  Origin: string;
  /**
*@deprecated
The HTTP Pragma header is an implementation-specific header that may have various effects along the request-response chain.

This header serves for backwards compatibility with HTTP/1.0 caches that do not support the Cache-Control HTTP/1.1 header.
@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Pragma
* */
  Pragma: string;
  /**
*The HTTP Prefer header allows clients to indicate preferences for specific server behaviors during request processing.
@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Prefer
* */
  Prefer: string;
  /**
*The HTTP Preference-Applied header informs the client about which preferences from the Prefer request header were applied by the server.

The server indicates if a preference is applied to a response if it would otherwise be ambiguous for the client.
@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Preference-Applied
* */
  "Preference-Applied": string;
  /**
*The HTTP Priority header indicates a client's preference for the priority order at which the response containing the requested resource should be sent, relative to other resource requests on the same connection.

If the header is not specified in the request, a default priority is assumed.

The server may also include this header in responses in order to indicate it has an interest in changing the prioritization preferences the client advertized.

In responses, this information can be used as an input to the prioritization process for caching servers and other servers that are forwarding the response.
@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Priority
* */
  Priority: string;
  /**
*The HTTP Proxy-Authenticate response header defines the authentication method (or challenge) that should be used to gain access to a resource behind a proxy server.

It is sent in a 407 Proxy Authentication Required response so a client can identify itself to a proxy that requires authentication.
@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Proxy-Authenticate
* */
  "Proxy-Authenticate": string;
  /**
*The HTTP Proxy-Authorization request header contains the credentials to authenticate a client with a proxy server, typically after the server has responded with a 407 Proxy Authentication Required status with the Proxy-Authenticate header.
@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Proxy-Authorization
* */
  "Proxy-Authorization": string;
  /**
*The HTTP Range request header indicates the part of a resource that the server should return.

Several parts can be requested at the same time in one Range header, and the server may send back these ranges in a multipart document.

If the server sends back ranges, it uses the 206 Partial Content status code for the response. If the ranges are invalid, the server returns the 416 Range Not Satisfiable error.
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Range
* */
  Range: string;
  /**
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Referer
   * */
  Referer: string;
  /**
   *@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Refresh
   * */
  Refresh: string;
  /**
   * @deprecated
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Report-To
   * */
  "Report-To": string;
  /**
*@limitedAvailability
@see https://developer.mozilla.org/en-US/docs/Web
* */
  "Reporting-Endpoints": string;
  /**
   *@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Repr-Digest
   * */
  "Repr-Digest": string;
  /**
   *@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Retry-After
   * */
  "Retry-After": string;
  /**
   *@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-Fetch-Dest
   * */
  "Sec-Fetch-Dest": string;
  /**
   *@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-Fetch-Mode
   * */
  "Sec-Fetch-Mode": string;

  /**
   *@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-Fetch-Site
   * */
  "Sec-Fetch-Site": string;
  /**
   *@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-Fetch-User
   * */
  "Sec-Fetch-User": string;
  /**
   *@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-WebSocket-Accept
   * */
  "Sec-WebSocket-Accept": string;
  /**
   *@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-WebSocket-Extensions
   * */
  "Sec-WebSocket-Extensions": string;
  /**
   *@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-WebSocket-Key
   * */
  "Sec-WebSocket-Key": string;
  /**
   *@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-WebSocket-Protocol
   * */
  "Sec-WebSocket-Protocol": string;
  /**
   *@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-WebSocket-Version
   * */
  "Sec-WebSocket-Version": string;
  /**
   *@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Server
   * */
  Server: string;
  /**
   *@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Server-Timing
   * */
  "Server-Timing": string;
  /**
   *@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Service-Worker
   * */
  "Service-Worker": string;
  /**
   *@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Service-Worker-Allowed
   * */
  "Service-Worker-Allowed": string;
  /**
   * @limitedAvailability
   *@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Service-Worker-Navigation-Preload
   * */
  "Service-Worker-Navigation-Preload header": string;
  /**
   *@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie
   * */
  "Set-Cookie": string;
  /**
   *@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Login
   * */
  "Set-Login": string;
  /**
   *@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/SourceMap
   * */
  SourceMap: string;
  /**
   *@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Strict-Transport-Security
   * */
  "Strict-Transport-Security": string;
  /**
   *@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/TE
   * */
  TE: string;
  /**
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Timing-Allow-Origin
   **/
  "Timing-Allow-Origin": string;
  /**
*@deprecated
@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Tk
* */
  Tk: string;
  /**
   *@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Trailer
   * */
  Trailer: string;
  /**
   *@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Transfer-Encoding
   * */
  "Transfer-Encoding": string;
  /**
   *@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Upgrade
   * */
  Upgrade: string;
  /**
   *@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Upgrade-Insecure-Requests
   * */
  "Upgrade-Insecure-Requests": string;
  /**
   *@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/User-Agent
   * */
  "User-Agent": string;
  /**
   *@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Vary
   * */
  Vary: string;
  /**
   *@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Via
   * */
  Via: string;
  /**
   *@deprecated
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Viewport-Width
   * */
  "Viewport-Width": string;
  /**
   *@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Want-Content-Digest
   * */
  "Want-Content-Digest": string;
  /**
   *@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Want-Repr-Digest
   * */
  "Want-Repr-Digest": string;
  /**
   * @deprecated
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Warning
   * */
  Warning: string;
  /**
   * @deprecated
   *@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Width
   * */
  Width: string;
  /**
   *@see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/WWW-Authenticate
   * */
  "WWW-Authenticate": string;
};
export type BaseHeaders = Partial<
  simpleHeaders &
    helmetHeadersT &
    experimentalHeaders &
    CORSHeader & { [key: string]: string }
>;
/**
 * A map containing all headers as ArrayBuffers, so speed remains. There are several use cases of it:
 * 1) Don't define them in requests ( post(res){new HeadersMap({...headers}).prepare().toRes(res)} ). This is slow. Define maps BEFORE actual usage.
 * 2) You can pass them in LightMethod or HeavyMethod in shared property (but handle it manually)
 * 3) Don't define them before writing status on request. uWebSockets.js after first written header considers response as successful and puts "200" code automatically. Set headers AFTER validation in class controllers (handler function) and after writing status (or don't write it at all. It will be 200).
 */
export class HeadersMap<Opts extends BaseHeaders> extends Map {
  public currentHeaders: undefined | Opts;
  constructor(opts: Opts);
  /**
   * remove several headers from this map. Use BEFORE map.prepare(), because it will compare them by location in memory (string !== ArrayBuffer)
   * @example HeadersMap.default.remove("Content-Security-Policy", "X-DNS-Prefetch-Control", ...otherHeaders).prepare()
   */
  remove(...keys: (keyof Opts)[]): this;
  /**
   * last function before "going to response". It converts all strings to ArrayBuffers, so you should delete unwanted headers before it
   * @returns function, which sets all headers on the response.
   * @example
   * new HeadersMap({...HeadersMap.baseObj,"a":"a"}).remove("a").prepare();
   */
  prepare(): (res: uwsHttpResponse) => HttpResponse;
  /**
   * write all static headers to response. Use AFTER map.prepare function, if you want speed.
   * @example
   * headersMap.toRes(res);
   * // if you want dynamic headers, use BASE:
   * res.writeHeader(toAB(headerVariable),toAB(value))
   */
  toRes(res: uwsHttpResponse): HttpResponse;

  /**
   * obj, containing basic headers, which u can use as a background for own headers
   * @example
   * new HeadersMap({...HeadersMap.baseObj, "ownHeader":"hello world"}).remove("X-Download-Options")
   */
  static baseObj: helmetHeadersT;
  /**
   * map with default headers
   */
  static default: (res: uwsHttpResponse) => HttpResponse;
}
/**
 * This function creates Content-Security-Policy string.
 */
export function setCSP<T extends CSP>(
  mainCSP: T,
  ...remove: (keyof CSP)[]
): string;
type CSP = Partial<
  typeof CSPDirs & {
    /**
     * for websites with deprecated urls.
     */
    "upgrade-insecure-requests": string[];
  }
>;
/**
 * Usual CSP directories. If you want more dirs:
 * 1) I will put more in soon
 * 2) use string concatenation (use BASE)
 * @example
 * new HeadersMap({...HeadersMap.baseObj, "Content-Security-Policy":setCSP({...CSPDirs}) + " your-dir: 'self';"})
 */
export var CSPDirs: {
  /**
   * basic urls for resources, if other directives are missing
   */
  "default-src": string[];
  /**
   *used for html <base> tag
   */
  "base-uri": string[];
  /**
   * urls valid for css at-rule @font-face
   */
  "font-src": string[];
  /**
   * urls, allowed for <form action=""> action attribute. Forbidden at all='none'
   */
  "form-action": string[];
  /**
   * urls of sites, WHICH can embed YOUR page via <iframe> etc. 'none' = forbidden at all
   */
  "frame-ancestors": string[];
  /**
   * valid image urls. 'none' = forbidden at all
   */
  "img-src": string[];
  /**
   * controls urls of WebSocket, fetch, fetchLater, EventSources and Navigator.sendBeacon functions or ping attribute of <a> tag.
   */
  "connect-src": string[];
  /**
   * usually stuff it has influence on is deprecated, so put 'none'
   */
  "object-src": string[];
  /**
   * Urls for script tags. But also it forbids inline js scripts. 'none' - forbidden, 'self' - your site's scripts, 'unsafe-inline' - allows inline scripts
   */
  "script-src": string[];
  /**
   * More important than "script-src", specifies inline js scripts. 'unsafe-inline' - allow onclick and other inline attributes
   */
  "script-src-attr": string[];
  /**
   * More important than "script-src", specifies urls for <script> tag. 'none' - forbidden; 'unsafe-inline' - allow <script> tag without src=""; 'unsafe-eval' - for protobufjs;
   */
  "script-src-elem": string[];
  /**
   * Urls for style tags. But also it forbids inline css styles. 'none' - forbidden, 'self' - your site's styles, 'unsafe-inline' - allows inline styles
   */
  "style-src": string[];
  /**
   * More important than "style-src", specifies inline css styles.
   */
  "style-src-attr": string[];
  /**
   * More important than "style-src", specifies urls for <link> tag
   */
  "style-src-elem": string[];
  /**
   * Trusted Types XSS DOM API names. 'allow-duplicates', 'none'. Works for Chrome and Edge.
   */
  "trusted-types": string[];
  /**
   * specifies valid sources for Worker, SharedWorker, or ServiceWorker scripts.
   */
  "worker-src": string[];
  /**
   * specifies valid sources for loading media using the <audio> and <video> elements.
   */
  "media-src": string[];
};
export type lowHeaders = Lowercase<
  keyof (simpleHeaders & helmetHeadersT & experimentalHeaders & CORSHeader)
>;
