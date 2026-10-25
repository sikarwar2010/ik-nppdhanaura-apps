# Broken link report

Checked: 2026-10-25T09:12:54.408Z by `scripts/check-links.ts` (HEAD, then GET; 20 s timeout; 2 attempts).

**23** external URLs checked: **14** reachable by script, **4** blocked scripts but load in a browser, **5** failing or unconfirmed.

A failure from this checker can mean the site blocks automated requests or is slow from this network, not only that the page is gone. Failing links are listed for manual confirmation.

## Failing or unconfirmed

| URL | Script result | Browser check | Used by |
| --- | --- | --- | --- |
| http://uppwd.gov.in/ | error TypeError: Connect Timeout Error (attempted address: uppwd.gov.in:80, timeout: 10000ms) | http:// does not connect; https://uppwd.gov.in/ loads. Site now links the https URL. | source-site |
| https://crsorgi.gov.in/ | error TypeError: Response does not match the HTTP/1.1 protocol (Missing expected CR after header value) | Server sends a malformed HTTP header to scripts; the browser check could not be completed here. Confirm manually. | service:birth-death-certificate, department:civil-registration, important-links, source-site |
| https://niveshmitra.up.nic.in/Documents/User_Process_Flow/UPS_107.pdf | error TypeError: unable to verify the first certificate; if the root CA is installed locally, try running Node.js with --use-system-ca | Server's TLS certificate chain is incomplete for Node.js; browsers usually complete it. Confirm the PDF opens manually. | service:trade-license, document:trade-license-process-guideline, source-site |
| https://swachhbharaturban.gov.in/ | error TypeError: Connect Timeout Error (attempted address: swachhbharaturban.gov.in:443, timeout: 10000ms) | Times out in a browser too (ERR_CONNECTION_TIMED_OUT). Replaced with https://sbmurban.org/. | source-site |
| https://uppwd.gov.in/ | error TypeError: unable to verify the first certificate; if the root CA is installed locally, try running Node.js with --use-system-ca | not checked | department:public-works |

## Blocked automated checks, load in a browser

| URL | Script result | Browser check | Used by |
| --- | --- | --- | --- |
| https://etender.up.nic.in/nicgep/app | http 500 | Loads in a browser ('eProcurement System Government of Uttar Pradesh'); returns 500 to scripts. | important-links, tenders, source-site |
| https://india.gov.in/ | http 403 | Loads in a browser (redirects to www.india.gov.in); returns 403 to scripts. | important-links, source-site |
| https://pmaymis.gov.in/ | http 404 | Loads in a browser ('PMAY-HFA(Urban)'); returns 404 to scripts. Linked only from the source site. | source-site |
| https://pmsvanidhi.mohua.gov.in/ | http 404 | Loads in a browser ('PM SVANidhi'); returns 404 to scripts. | scheme:pm-svanidhi, source-site |

## Reachable

| URL | Result | Redirects to | Used by |
| --- | --- | --- | --- |
| https://amrut.mohua.gov.in/ | ok 200 |  | scheme:amrut, source-site |
| https://e-nagarsewaup.gov.in/ | ok 200 |  | service:property-water-tax, department:revenue-tax, important-links, source-site |
| https://eeslindia.org/en/slnp/ | ok 200 | https://eeslindia.org/wp-content/uploads/2020/10/slnp.png | department:street-lighting, source-site |
| https://jaljeevanmission.gov.in/ | ok 200 |  | department:water-supply, source-site |
| https://localbodies.up.nic.in/ | ok 200 |  | important-links, source-site |
| https://nulm.gov.in/ | ok 200 |  | scheme:nulm, source-site |
| https://pgportal.gov.in/Registration | ok 200 | https://pgportal.gov.in/Error/NotFound | service:grievance-registration, important-links, source-site |
| https://pmay-urban.gov.in/ | ok 200 |  | scheme:pmay-urban, source-site |
| https://pmayg.dord.gov.in/netiayHome/Home.aspx | ok 200 |  | scheme:pmay-gramin, source-site |
| https://rti.dopt.gov.in/ | ok 200 |  | service:rti-citizen-charter, source-site |
| https://sbm.gov.in/sbm_dbt/secure/Login.aspx | ok 200 |  | source-site |
| https://sbmurban.org/ | ok 200 |  | service:sanitation-waste-management, scheme:swachh-bharat-mission-urban, important-links |
| https://swachhbharatmission.ddws.gov.in/ | ok 200 |  | department:public-health-sanitation, source-site |
| https://up.gov.in/ | ok 200 |  | important-links, source-site |
