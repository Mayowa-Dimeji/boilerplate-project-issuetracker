const chaiHttp = require("chai-http");
const chai = require("chai");
const assert = chai.assert;
const server = require("../server");

chai.use(chaiHttp);

suite("Functional Tests", function () {
  suite("POST /api/issues/{project} => object with issue data", function () {
    test("Create an issue with every field", function (done) {
      chai
        .request(server)
        .post("/api/issues/apitest")
        .send({
          issue_title: "Title",
          issue_text: "text",
          created_by: "Functional Test - Every field",
          assigned_to: "Chai and Mocha",
          status_text: "In QA",
        })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.body.issue_title, "Title");
          assert.equal(res.body.issue_text, "text");
          assert.equal(res.body.created_by, "Functional Test - Every field");
          assert.equal(res.body.assigned_to, "Chai and Mocha");
          assert.equal(res.body.status_text, "In QA");
          done();
        });
    });

    test("Create an issue with only required fields", function (done) {
      chai
        .request(server)
        .post("/api/issues/apitest")
        .send({
          issue_title: "Title",
          issue_text: "text",
          created_by: "Functional Test - Required fields",
        })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.body.issue_title, "Title");
          assert.equal(res.body.issue_text, "text");
          assert.equal(
            res.body.created_by,
            "Functional Test - Required fields"
          );
          assert.equal(res.body.assigned_to, "");
          assert.equal(res.body.status_text, "");
          done();
        });
    });

    test("Create an issue with missing required fields", function (done) {
      chai
        .request(server)
        .post("/api/issues/apitest")
        .send({
          issue_title: "Title",
        })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.body.error, "required field(s) missing");
          done();
        });
    });
  });

  suite(
    "GET /api/issues/{project} => Array of objects with issue data",
    function () {
      suiteSetup(function (done) {
        chai
          .request(server)
          .post("/api/issues/apitest")
          .send({
            // _id: "1", // Ensure this ID is used
            issue_title: "Initial Title",
            issue_text: "Initial Text",
            created_by: "Initial Creator",
            assigned_to: "",
            status_text: "",
          })
          .end(function (err, res) {
            if (err) done(err);
            done();
          });
      });

      test("View issues on a project", function (done) {
        chai
          .request(server)
          .get("/api/issues/apitest")
          .end(function (err, res) {
            assert.equal(res.status, 200);
            assert.isArray(res.body);
            done();
          });
      });

      test("View issues on a project with one filter", function (done) {
        chai
          .request(server)
          .get("/api/issues/apitest")
          .query({ assigned_to: "Chai and Mocha" })
          .end(function (err, res) {
            assert.equal(res.status, 200);
            console.log(res.body); // Log the response body to understand its structure

            // Check if res.body is an array
            assert.isArray(res.body);

            // Ensure there's at least one issue in the array
            assert.isNotEmpty(res.body);

            // Iterate through each issue in the response body
            res.body.forEach((issue) => {
              assert.equal(issue.assigned_to, "Chai and Mocha");
            });

            done();
          });
      });

      test("View issues on a project with multiple filters", function (done) {
        chai
          .request(server)
          .get("/api/issues/apitest")
          .query({
            assigned_to: "Chai and Mocha",
            open: true,
          })
          .end(function (err, res) {
            assert.equal(res.status, 200);
            assert.isArray(res.body);
            res.body.forEach((issue) => {
              assert.equal(issue.assigned_to, "Chai and Mocha");
              assert.equal(issue.open, true);
            });
            done();
          });
      });
    }
  );

  suite("PUT /api/issues/{project} => text", function () {
    test("Update one field on an issue", function (done) {
      chai
        .request(server)
        .post(`/api/issues/apitest`)
        .send({
          issue_title: "Test Issue",
          issue_text: "Test issue text",
          created_by: "Test User",
          assigned_to: "Test Assignee",
          status_text: "Test Status",
        })
        .end(function (err, res) {
          const newIssueId = res.body._id; // Capture the generated ID

          chai
            .request(server)
            .put(`/api/issues/apitest`)
            .send({
              _id: newIssueId,
              created_by: "May",
            })
            .end(function (err, res) {
              assert.equal(res.status, 200);
              assert.equal(res.body.result, "successfully updated");
              assert.equal(res.body._id, newIssueId);
              done();
            });
        });
    });

    test("Update multiple fields on an issue", function (done) {
      chai
        .request(server)
        .post(`/api/issues/apitest`)
        .send({
          issue_title: "Test Issue",
          issue_text: "Test issue text",
          created_by: "Test User",
          assigned_to: "Test Assignee",
          status_text: "Test Status",
        })
        .end(function (err, res) {
          const newIssueId = res.body._id; // Capture the generated ID

          chai
            .request(server)
            .put(`/api/issues/apitest`)
            .send({
              _id: newIssueId,
              issue_title: "Updated Title",
              issue_text: "Updated Text",
            })
            .end(function (err, res) {
              assert.equal(res.status, 200);
              assert.equal(res.body.result, "successfully updated");
              assert.equal(res.body._id, newIssueId);
              done();
            });
        });
    });

    test("Update an issue with missing _id", function (done) {
      chai
        .request(server)
        .put("/api/issues/apitest")
        .send({
          issue_title: "Updated Title",
        })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.body.error, "missing _id");
          done();
        });
    });

    test("Update an issue with no fields to update", function (done) {
      chai
        .request(server)
        .post(`/api/issues/apitest`)
        .send({
          issue_title: "Test Issue",
          issue_text: "Test issue text",
          created_by: "Test User",
          assigned_to: "Test Assignee",
          status_text: "Test Status",
        })
        .end(function (err, res) {
          const newIssueId = res.body._id; // Capture the generated ID

          chai
            .request(server)
            .put(`/api/issues/apitest`)
            .send({
              _id: newIssueId, // Replace with a valid _id from your issues
            })
            .end(function (err, res) {
              assert.equal(res.status, 200);
              assert.equal(res.body.error, "no update field(s) sent");
              assert.equal(res.body._id, newIssueId);
              done();
            });
        });
    });

    test("Update an issue with an invalid _id", function (done) {
      chai
        .request(server)
        .put("/api/issues/apitest")
        .send({
          _id: "invalid_id",
          issue_title: "Updated Title",
        })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.body.error, "could not update");
          assert.equal(res.body._id, "invalid_id");
          done();
        });
    });
  });

  suite("DELETE /api/issues/{project} => text", function () {
    test("Delete an issue", function (done) {
      chai
        .request(server)
        .post(`/api/issues/apitest`)
        .send({
          issue_title: "Test Issue",
          issue_text: "Test issue text",
          created_by: "Test User",
          assigned_to: "Test Assignee",
          status_text: "Test Status",
        })
        .end(function (err, res) {
          const newIssueId = res.body._id; // Capture the generated ID

          chai
            .request(server)
            .delete(`/api/issues/apitest`)
            .send({
              _id: newIssueId,
            })
            .end(function (err, res) {
              assert.equal(res.status, 200);
              assert.equal(res.body.result, "successfully deleted");
              assert.equal(res.body._id, newIssueId);
              done();
            });
        });
    });

    test("Delete an issue with an invalid _id", function (done) {
      chai
        .request(server)
        .delete("/api/issues/test")
        .send({
          _id: "invalid_id",
        })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.body.error, "could not delete");
          assert.equal(res.body._id, "invalid_id");
          done();
        });
    });

    test("Delete an issue with missing _id", function (done) {
      chai
        .request(server)
        .delete("/api/issues/test")
        .send({})
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.body.error, "missing _id");
          done();
        });
    });
  });
});
