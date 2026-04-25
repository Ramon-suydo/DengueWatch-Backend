$baseDir = "D:\Project\DengueWatch-Backend\postman\collections\DengueWatch API\Reports\"
$enc = [System.Text.UTF8Encoding]::new($false)

# ─── FILE 1 ───────────────────────────────────────────────────────────────────
$f1 = @'
$kind: http-request
name: GET All Reports
description: Retrieve all dengue reports ordered by creation date (DESC)
method: GET
url: '{{baseUrl}}/api/reports'
order: 1000
scripts:
  - type: afterResponse
    language: text/javascript
    code: |-
      const jsonData = pm.response.json();

      // 1. Status code
      pm.test("Status code is 200", function () {
          pm.response.to.have.status(200);
      });

      // 2. Response time
      pm.test("Response time is under 2000ms", function () {
          pm.expect(pm.response.responseTime).to.be.below(2000);
      });

      // 3. Wrapper shape
      pm.test("Response has success wrapper { success, message, data }", function () {
          pm.expect(jsonData).to.have.property('success', true);
          pm.expect(jsonData).to.have.property('message').that.is.a('string');
          pm.expect(jsonData).to.have.property('data');
      });

      // 4. data is an array
      pm.test("data is an array", function () {
          pm.expect(jsonData.data).to.be.an('array');
      });

      // 5. Each report has all model fields
      pm.test("Each report has required model fields", function () {
          if (jsonData.data.length > 0) {
              jsonData.data.forEach(function (report) {
                  pm.expect(report).to.have.property('id').that.is.a('number');
                  pm.expect(report).to.have.property('location').that.is.a('string');
                  pm.expect(report).to.have.property('cases').that.is.a('number');
                  pm.expect(report).to.have.property('notes');
                  pm.expect(report).to.have.property('latitude');
                  pm.expect(report).to.have.property('longitude');
                  pm.expect(report).to.have.property('createdAt');
                  pm.expect(report).to.have.property('updatedAt');
              });
          }
      });

      // 6. Ordered by createdAt DESC
      pm.test("Reports are ordered newest first (createdAt DESC)", function () {
          if (jsonData.data.length > 1) {
              for (let i = 0; i < jsonData.data.length - 1; i++) {
                  const current = new Date(jsonData.data[i].createdAt).getTime();
                  const next    = new Date(jsonData.data[i + 1].createdAt).getTime();
                  pm.expect(current).to.be.at.least(next);
              }
          }
      });

      // 7. cases is non-negative on every record
      pm.test("cases is a non-negative integer on every report", function () {
          jsonData.data.forEach(function (report) {
              pm.expect(report.cases).to.be.a('number');
              pm.expect(report.cases).to.be.at.least(0);
          });
      });

      // 8. Correct success message
      pm.test("Message is 'Reports fetched successfully'", function () {
          pm.expect(jsonData.message).to.eql('Reports fetched successfully');
      });
'@
$f1 = $f1 -replace "`r`n", "`n" -replace "`r", "`n"
[System.IO.File]::WriteAllText($baseDir + "GET All Reports.request.yaml", $f1, $enc)
Write-Host "FILE 1 written"

# ─── FILE 2 ───────────────────────────────────────────────────────────────────
$f2 = @'
$kind: http-request
name: GET Report by ID
description: Retrieve a single dengue report by its ID
method: GET
url: '{{baseUrl}}/api/reports/:id'
order: 2000
pathVariables:
  - key: id
    value: '{{createdReportId}}'
scripts:
  - type: afterResponse
    language: text/javascript
    code: |-
      const jsonData = pm.response.json();

      // 1. Status code
      pm.test("Status code is 200 or 404", function () {
          pm.expect(pm.response.code).to.be.oneOf([200, 404]);
      });

      // 2. Response time
      pm.test("Response time is under 2000ms", function () {
          pm.expect(pm.response.responseTime).to.be.below(2000);
      });

      // 3. Wrapper always present
      pm.test("Response always has success, message, data fields", function () {
          pm.expect(jsonData).to.have.property('success');
          pm.expect(jsonData).to.have.property('message').that.is.a('string');
          pm.expect(jsonData).to.have.property('data');
      });

      if (pm.response.code === 200) {
          // 4. success is true on 200
          pm.test("success is true on 200", function () {
              pm.expect(jsonData.success).to.be.true;
          });

          // 5. Correct message
          pm.test("Message is 'Report fetched successfully'", function () {
              pm.expect(jsonData.message).to.eql('Report fetched successfully');
          });

          // 6. data has all model fields
          pm.test("data has all required model fields", function () {
              pm.expect(jsonData.data).to.have.property('id').that.is.a('number');
              pm.expect(jsonData.data).to.have.property('location').that.is.a('string');
              pm.expect(jsonData.data).to.have.property('cases').that.is.a('number');
              pm.expect(jsonData.data).to.have.property('notes');
              pm.expect(jsonData.data).to.have.property('latitude');
              pm.expect(jsonData.data).to.have.property('longitude');
              pm.expect(jsonData.data).to.have.property('createdAt');
              pm.expect(jsonData.data).to.have.property('updatedAt');
          });

          // 7. ID matches the requested ID
          pm.test("Returned report ID matches requested ID", function () {
              const requestedId = parseInt(pm.request.url.variables.get('id') || pm.environment.get('createdReportId'));
              pm.expect(jsonData.data.id).to.eql(requestedId);
          });

          // 8. cases is non-negative
          pm.test("cases is a non-negative integer", function () {
              pm.expect(jsonData.data.cases).to.be.at.least(0);
          });
      }

      if (pm.response.code === 404) {
          // 9. success is false on 404
          pm.test("success is false on 404", function () {
              pm.expect(jsonData.success).to.be.false;
          });

          // 10. Correct 404 message
          pm.test("Message is 'Report not found'", function () {
              pm.expect(jsonData.message).to.eql('Report not found');
          });

          // 11. data is null on 404
          pm.test("data is null on 404", function () {
              pm.expect(jsonData.data).to.be.null;
          });
      }
'@
$f2 = $f2 -replace "`r`n", "`n" -replace "`r", "`n"
[System.IO.File]::WriteAllText($baseDir + "GET Report by ID.request.yaml", $f2, $enc)
Write-Host "FILE 2 written"

# ─── FILE 3 ───────────────────────────────────────────────────────────────────
$f3 = @'
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
      const jsonData = pm.response.json();

      // 1. Status code
      pm.test("Status code is 201", function () {
          pm.response.to.have.status(201);
      });

      // 2. Response time
      pm.test("Response time is under 2000ms", function () {
          pm.expect(pm.response.responseTime).to.be.below(2000);
      });

      // 3. Wrapper shape
      pm.test("Response has success wrapper { success, message, data }", function () {
          pm.expect(jsonData).to.have.property('success', true);
          pm.expect(jsonData).to.have.property('message').that.is.a('string');
          pm.expect(jsonData).to.have.property('data');
      });

      // 4. Correct message
      pm.test("Message is 'Report created successfully'", function () {
          pm.expect(jsonData.message).to.eql('Report created successfully');
      });

      // 5. data has all model fields
      pm.test("data has all required model fields", function () {
          pm.expect(jsonData.data).to.have.property('id').that.is.a('number');
          pm.expect(jsonData.data).to.have.property('location').that.is.a('string');
          pm.expect(jsonData.data).to.have.property('cases').that.is.a('number');
          pm.expect(jsonData.data).to.have.property('notes');
          pm.expect(jsonData.data).to.have.property('latitude');
          pm.expect(jsonData.data).to.have.property('longitude');
          pm.expect(jsonData.data).to.have.property('createdAt');
          pm.expect(jsonData.data).to.have.property('updatedAt');
      });

      // 6. Persisted values match sent values
      pm.test("location matches sent value 'Manila'", function () {
          pm.expect(jsonData.data.location).to.eql('Manila');
      });

      pm.test("cases matches sent value 15", function () {
          pm.expect(jsonData.data.cases).to.eql(15);
      });

      pm.test("notes matches sent value", function () {
          pm.expect(jsonData.data.notes).to.eql('Cluster near barangay hall');
      });

      pm.test("latitude matches sent value 14.5995", function () {
          pm.expect(jsonData.data.latitude).to.be.closeTo(14.5995, 0.0001);
      });

      pm.test("longitude matches sent value 120.9842", function () {
          pm.expect(jsonData.data.longitude).to.be.closeTo(120.9842, 0.0001);
      });

      // 7. ID is a positive integer
      pm.test("ID is a positive integer", function () {
          pm.expect(jsonData.data.id).to.be.a('number');
          pm.expect(jsonData.data.id).to.be.above(0);
      });

      // 8. Save createdReportId for chained requests
      if (jsonData.data && jsonData.data.id) {
          pm.environment.set('createdReportId', jsonData.data.id);
          console.log('Saved createdReportId:', jsonData.data.id);
      }
'@
$f3 = $f3 -replace "`r`n", "`n" -replace "`r", "`n"
[System.IO.File]::WriteAllText($baseDir + "POST Create Report.request.yaml", $f3, $enc)
Write-Host "FILE 3 written"

# ─── FILE 4 ───────────────────────────────────────────────────────────────────
$f4 = @'
$kind: http-request
name: PUT Update Report
description: Update an existing dengue report
method: PUT
url: '{{baseUrl}}/api/reports/:id'
order: 4000
pathVariables:
  - key: id
    value: '{{createdReportId}}'
headers:
  - key: Content-Type
    value: application/json
body:
  type: json
  content: |-
    {
      "location": "Quezon City",
      "cases": 30,
      "notes": "Updated case count after re-survey",
      "latitude": 14.6760,
      "longitude": 121.0437
    }
scripts:
  - type: afterResponse
    language: text/javascript
    code: |-
      const jsonData = pm.response.json();

      // 1. Status code
      pm.test("Status code is 200 or 404", function () {
          pm.expect(pm.response.code).to.be.oneOf([200, 404]);
      });

      // 2. Response time
      pm.test("Response time is under 2000ms", function () {
          pm.expect(pm.response.responseTime).to.be.below(2000);
      });

      // 3. Wrapper always present
      pm.test("Response always has success, message, data fields", function () {
          pm.expect(jsonData).to.have.property('success');
          pm.expect(jsonData).to.have.property('message').that.is.a('string');
          pm.expect(jsonData).to.have.property('data');
      });

      if (pm.response.code === 200) {
          // 4. success is true on 200
          pm.test("success is true on 200", function () {
              pm.expect(jsonData.success).to.be.true;
          });

          // 5. Correct message
          pm.test("Message is 'Report updated successfully'", function () {
              pm.expect(jsonData.message).to.eql('Report updated successfully');
          });

          // 6. data has all model fields
          pm.test("data has all required model fields", function () {
              pm.expect(jsonData.data).to.have.property('id').that.is.a('number');
              pm.expect(jsonData.data).to.have.property('location').that.is.a('string');
              pm.expect(jsonData.data).to.have.property('cases').that.is.a('number');
              pm.expect(jsonData.data).to.have.property('notes');
              pm.expect(jsonData.data).to.have.property('latitude');
              pm.expect(jsonData.data).to.have.property('longitude');
              pm.expect(jsonData.data).to.have.property('createdAt');
              pm.expect(jsonData.data).to.have.property('updatedAt');
          });

          // 7. Updated values match sent values
          pm.test("location updated to 'Quezon City'", function () {
              pm.expect(jsonData.data.location).to.eql('Quezon City');
          });

          pm.test("cases updated to 30", function () {
              pm.expect(jsonData.data.cases).to.eql(30);
          });

          pm.test("notes updated correctly", function () {
              pm.expect(jsonData.data.notes).to.eql('Updated case count after re-survey');
          });

          pm.test("latitude updated to 14.6760", function () {
              pm.expect(jsonData.data.latitude).to.be.closeTo(14.6760, 0.0001);
          });

          pm.test("longitude updated to 121.0437", function () {
              pm.expect(jsonData.data.longitude).to.be.closeTo(121.0437, 0.0001);
          });
      }

      if (pm.response.code === 404) {
          // 8. success is false on 404
          pm.test("success is false on 404", function () {
              pm.expect(jsonData.success).to.be.false;
          });

          // 9. Correct 404 message
          pm.test("Message is 'Report not found'", function () {
              pm.expect(jsonData.message).to.eql('Report not found');
          });

          // 10. data is null on 404
          pm.test("data is null on 404", function () {
              pm.expect(jsonData.data).to.be.null;
          });
      }
'@
$f4 = $f4 -replace "`r`n", "`n" -replace "`r", "`n"
[System.IO.File]::WriteAllText($baseDir + "PUT Update Report.request.yaml", $f4, $enc)
Write-Host "FILE 4 written"

# ─── FILE 5 ───────────────────────────────────────────────────────────────────
$f5 = @'
$kind: http-request
name: DELETE Report
description: Delete a dengue report by ID
method: DELETE
url: '{{baseUrl}}/api/reports/:id'
order: 5000
pathVariables:
  - key: id
    value: '{{createdReportId}}'
scripts:
  - type: afterResponse
    language: text/javascript
    code: |-
      const jsonData = pm.response.json();

      // 1. Status code
      pm.test("Status code is 200 or 404", function () {
          pm.expect(pm.response.code).to.be.oneOf([200, 404]);
      });

      // 2. Response time
      pm.test("Response time is under 2000ms", function () {
          pm.expect(pm.response.responseTime).to.be.below(2000);
      });

      // 3. Wrapper always present
      pm.test("Response always has success, message, data fields", function () {
          pm.expect(jsonData).to.have.property('success');
          pm.expect(jsonData).to.have.property('message').that.is.a('string');
          pm.expect(jsonData).to.have.property('data');
      });

      if (pm.response.code === 200) {
          // 4. success is true on 200
          pm.test("success is true on 200", function () {
              pm.expect(jsonData.success).to.be.true;
          });

          // 5. Correct message
          pm.test("Message is 'Report deleted successfully'", function () {
              pm.expect(jsonData.message).to.eql('Report deleted successfully');
          });

          // 6. data is null after deletion
          pm.test("data is null after deletion", function () {
              pm.expect(jsonData.data).to.be.null;
          });

          // 7. Clean up environment variable
          pm.environment.unset('createdReportId');
          console.log('Cleaned up createdReportId from environment');
      }

      if (pm.response.code === 404) {
          // 8. success is false on 404
          pm.test("success is false on 404", function () {
              pm.expect(jsonData.success).to.be.false;
          });

          // 9. Correct 404 message
          pm.test("Message is 'Report not found'", function () {
              pm.expect(jsonData.message).to.eql('Report not found');
          });

          // 10. data is null on 404
          pm.test("data is null on 404", function () {
              pm.expect(jsonData.data).to.be.null;
          });
      }
'@
$f5 = $f5 -replace "`r`n", "`n" -replace "`r", "`n"
[System.IO.File]::WriteAllText($baseDir + "DELETE Report.request.yaml", $f5, $enc)
Write-Host "FILE 5 written"

Write-Host "ALL 5 FILES WRITTEN SUCCESSFULLY"
