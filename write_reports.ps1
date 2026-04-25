$basePath = 'D:\Project\DengueWatch-Backend\postman\collections\DengueWatch API\Reports\'

# File 1: GET All Reports.request.yaml
$file1 = @'
$kind: http-request
name: GET All Reports
description: Retrieve all dengue reports ordered by creation date
method: GET
url: '{{baseUrl}}/api/reports'
order: 1000
scripts:
  - type: afterResponse
    language: text/javascript
    code: |-
      pm.test("Status code is 200", function () {
          pm.response.to.have.status(200);
      });

      pm.test("Response has success wrapper", function () {
          const jsonData = pm.response.json();
          pm.expect(jsonData).to.have.property('success', true);
          pm.expect(jsonData).to.have.property('message');
          pm.expect(jsonData).to.have.property('data');
      });

      pm.test("Response data is an array", function () {
          const jsonData = pm.response.json();
          pm.expect(jsonData.data).to.be.an('array');
      });

      pm.test("Response time is under 2000ms", function () {
          pm.expect(pm.response.responseTime).to.be.below(2000);
      });

      pm.test("Each report has required fields", function () {
          const jsonData = pm.response.json();
          if (jsonData.data.length > 0) {
              jsonData.data.forEach(function(report) {
                  pm.expect(report).to.have.property('id');
                  pm.expect(report).to.have.property('location');
                  pm.expect(report).to.have.property('cases');
                  pm.expect(report).to.have.property('createdAt');
                  pm.expect(report).to.have.property('updatedAt');
              });
          }
      });
'@
$file1 = $file1 -replace "`n", "`r`n"
[System.IO.File]::WriteAllText($basePath + 'GET All Reports.request.yaml', $file1, [System.Text.Encoding]::UTF8)
Write-Host "File 1 written."

# File 2: GET Report by ID.request.yaml
$file2 = @'
$kind: http-request
name: GET Report by ID
description: Retrieve a single dengue report by its ID
method: GET
url: '{{baseUrl}}/api/reports/:id'
order: 2000
pathVariables:
  - key: id
    value: '1'
scripts:
  - type: afterResponse
    language: text/javascript
    code: |-
      pm.test("Status code is 200 or 404", function () {
          pm.expect(pm.response.code).to.be.oneOf([200, 404]);
      });

      pm.test("Response time is under 2000ms", function () {
          pm.expect(pm.response.responseTime).to.be.below(2000);
      });

      if (pm.response.code === 200) {
          pm.test("Response has success wrapper", function () {
              const jsonData = pm.response.json();
              pm.expect(jsonData).to.have.property('success', true);
              pm.expect(jsonData).to.have.property('message');
              pm.expect(jsonData).to.have.property('data');
          });

          pm.test("Report has required fields", function () {
              const jsonData = pm.response.json();
              pm.expect(jsonData.data).to.have.property('id');
              pm.expect(jsonData.data).to.have.property('location');
              pm.expect(jsonData.data).to.have.property('cases');
              pm.expect(jsonData.data).to.have.property('createdAt');
              pm.expect(jsonData.data).to.have.property('updatedAt');
          });

          pm.test("Report id matches requested id", function () {
              const jsonData = pm.response.json();
              pm.expect(jsonData.data.id).to.eql(1);
          });
      }

      if (pm.response.code === 404) {
          pm.test("404 response has success false and message", function () {
              const jsonData = pm.response.json();
              pm.expect(jsonData).to.have.property('success', false);
              pm.expect(jsonData).to.have.property('message');
          });
      }
'@
$file2 = $file2 -replace "`n", "`r`n"
[System.IO.File]::WriteAllText($basePath + 'GET Report by ID.request.yaml', $file2, [System.Text.Encoding]::UTF8)
Write-Host "File 2 written."

# File 3: POST Create Report.request.yaml
$file3 = @'
$kind: http-request
name: POST Create Report
description: Create a new dengue report
method: POST
url: '{{baseUrl}}/api/reports'
order: 3000
headers:
  - key: Content-Type
    value: application/json
body:
  type: json
  content: |-
    {
      "location": "Manila",
      "cases": 15,
      "notes": "Cluster near barangay hall",
      "latitude": 14.5995,
      "longitude": 120.9842
    }
scripts:
  - type: afterResponse
    language: text/javascript
    code: |-
      pm.test("Status code is 201", function () {
          pm.response.to.have.status(201);
      });

      pm.test("Response has success wrapper", function () {
          const jsonData = pm.response.json();
          pm.expect(jsonData).to.have.property('success', true);
          pm.expect(jsonData).to.have.property('message');
          pm.expect(jsonData).to.have.property('data');
      });

      pm.test("Response data has required fields", function () {
          const jsonData = pm.response.json();
          pm.expect(jsonData.data).to.have.property('id');
          pm.expect(jsonData.data).to.have.property('location');
          pm.expect(jsonData.data).to.have.property('cases');
          pm.expect(jsonData.data).to.have.property('createdAt');
          pm.expect(jsonData.data).to.have.property('updatedAt');
      });

      pm.test("Location matches sent value", function () {
          const jsonData = pm.response.json();
          pm.expect(jsonData.data.location).to.eql("Manila");
      });

      pm.test("Cases matches sent value", function () {
          const jsonData = pm.response.json();
          pm.expect(jsonData.data.cases).to.eql(15);
      });

      pm.test("ID is a number", function () {
          const jsonData = pm.response.json();
          pm.expect(jsonData.data.id).to.be.a('number');
      });

      // Save the created report ID for use in subsequent requests
      const jsonData = pm.response.json();
      if (jsonData.data && jsonData.data.id) {
          pm.environment.set("createdReportId", jsonData.data.id);
      }
'@
$file3 = $file3 -replace "`n", "`r`n"
[System.IO.File]::WriteAllText($basePath + 'POST Create Report.request.yaml', $file3, [System.Text.Encoding]::UTF8)
Write-Host "File 3 written."

# File 4: PUT Update Report.request.yaml
$file4 = @'
$kind: http-request
name: PUT Update Report
description: Update an existing dengue report
method: PUT
url: '{{baseUrl}}/api/reports/:id'
order: 4000
pathVariables:
  - key: id
    value: '1'
headers:
  - key: Content-Type
    value: application/json
body:
  type: json
  content: |-
    {
      "location": "Manila",
      "cases": 20,
      "notes": "Updated case count",
      "latitude": 14.5995,
      "longitude": 120.9842
    }
scripts:
  - type: afterResponse
    language: text/javascript
    code: |-
      pm.test("Status code is 200 or 404", function () {
          pm.expect(pm.response.code).to.be.oneOf([200, 404]);
      });

      pm.test("Response time is under 2000ms", function () {
          pm.expect(pm.response.responseTime).to.be.below(2000);
      });

      if (pm.response.code === 200) {
          pm.test("Response has success wrapper", function () {
              const jsonData = pm.response.json();
              pm.expect(jsonData).to.have.property('success', true);
              pm.expect(jsonData).to.have.property('message');
              pm.expect(jsonData).to.have.property('data');
          });

          pm.test("Response data has required fields", function () {
              const jsonData = pm.response.json();
              pm.expect(jsonData.data).to.have.property('id');
              pm.expect(jsonData.data).to.have.property('location');
              pm.expect(jsonData.data).to.have.property('cases');
          });

          pm.test("Cases updated to new value", function () {
              const jsonData = pm.response.json();
              pm.expect(jsonData.data.cases).to.eql(20);
          });

          pm.test("Notes updated to new value", function () {
              const jsonData = pm.response.json();
              pm.expect(jsonData.data.notes).to.eql("Updated case count");
          });
      }

      if (pm.response.code === 404) {
          pm.test("404 response has success false and message", function () {
              const jsonData = pm.response.json();
              pm.expect(jsonData).to.have.property('success', false);
              pm.expect(jsonData).to.have.property('message');
          });
      }
'@
$file4 = $file4 -replace "`n", "`r`n"
[System.IO.File]::WriteAllText($basePath + 'PUT Update Report.request.yaml', $file4, [System.Text.Encoding]::UTF8)
Write-Host "File 4 written."

# File 5: DELETE Report.request.yaml
$file5 = @'
$kind: http-request
name: DELETE Report
description: Delete a dengue report by ID
method: DELETE
url: '{{baseUrl}}/api/reports/:id'
order: 5000
pathVariables:
  - key: id
    value: '1'
scripts:
  - type: afterResponse
    language: text/javascript
    code: |-
      pm.test("Status code is 200 or 404", function () {
          pm.expect(pm.response.code).to.be.oneOf([200, 404]);
      });

      pm.test("Response time is under 2000ms", function () {
          pm.expect(pm.response.responseTime).to.be.below(2000);
      });

      if (pm.response.code === 200) {
          pm.test("Response has success wrapper", function () {
              const jsonData = pm.response.json();
              pm.expect(jsonData).to.have.property('success', true);
              pm.expect(jsonData).to.have.property('message');
          });

          pm.test("Success message is correct", function () {
              const jsonData = pm.response.json();
              pm.expect(jsonData.message).to.eql("Report deleted successfully");
          });
      }

      if (pm.response.code === 404) {
          pm.test("404 response has success false and message", function () {
              const jsonData = pm.response.json();
              pm.expect(jsonData).to.have.property('success', false);
              pm.expect(jsonData).to.have.property('message');
          });
      }
'@
$file5 = $file5 -replace "`n", "`r`n"
[System.IO.File]::WriteAllText($basePath + 'DELETE Report.request.yaml', $file5, [System.Text.Encoding]::UTF8)
Write-Host "File 5 written."

# Verify all files
$files = @('GET All Reports.request.yaml','GET Report by ID.request.yaml','POST Create Report.request.yaml','PUT Update Report.request.yaml','DELETE Report.request.yaml')
foreach ($f in $files) {
    $fullPath = $basePath + $f
    if (Test-Path $fullPath) {
        $size = (Get-Item $fullPath).Length
        Write-Host "EXISTS: $f ($size bytes)"
    } else {
        Write-Host "MISSING: $f"
    }
}
