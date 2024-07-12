"use strict";

module.exports = function (app) {
  let issues = [];

  app
    .route("/api/issues/:project")

    .get(function (req, res) {
      const project = req.params.project;
      const query = { ...req.query };

      // Convert 'open' query parameter to boolean if it's present
      if (query.open !== undefined) query.open = query.open === "true";

      const filteredIssues = issues.filter((issue) => {
        let isValid = issue.project === project;

        // Check each query parameter against the corresponding issue property
        for (let key in query) {
          if (key !== "project" && query[key] !== undefined) {
            if (issue[key] === undefined || issue[key] != query[key]) {
              isValid = false;
              break;
            }
          }
        }

        return isValid;
      });

      res.json(filteredIssues);
    })

    .post(function (req, res) {
      const project = req.params.project;
      const { issue_title, issue_text, created_by, assigned_to, status_text } =
        req.body;

      if (!issue_title || !issue_text || !created_by) {
        return res.json({ error: "required field(s) missing" });
      }

      const newIssue = {
        _id: Date.now().toString(),
        issue_title,
        issue_text,
        created_on: new Date(),
        updated_on: new Date(),
        created_by,
        assigned_to: assigned_to || "",
        open: true,
        status_text: status_text || "",
        project,
      };

      issues.push(newIssue);
      res.json(newIssue);
    })

    .put(function (req, res) {
      const {
        _id,
        issue_title,
        issue_text,
        created_by,
        assigned_to,
        status_text,
        open,
      } = req.body;

      if (!_id) {
        return res.json({ error: "missing _id" });
      }

      const issue = issues.find((issue) => issue._id === _id);

      if (!issue) {
        return res.json({ error: "could not update", _id: _id });
      }

      // Check if any update fields are provided
      const updateFields = {
        issue_title,
        issue_text,
        created_by,
        assigned_to,
        status_text,
        open,
      };
      const hasUpdateFields = Object.values(updateFields).some(
        (field) => field !== undefined
      );

      if (!hasUpdateFields) {
        return res.json({ error: "no update field(s) sent", _id: _id });
      }

      // Update fields if provided
      if (issue_title !== undefined) issue.issue_title = issue_title;
      if (issue_text !== undefined) issue.issue_text = issue_text;
      if (created_by !== undefined) issue.created_by = created_by;
      if (assigned_to !== undefined) issue.assigned_to = assigned_to;
      if (status_text !== undefined) issue.status_text = status_text;
      if (open !== undefined) issue.open = open;

      issue.updated_on = new Date();

      res.json({ result: "successfully updated", _id: _id });
    })

    .delete(function (req, res) {
      const { _id } = req.body;

      if (!_id) {
        return res.json({ error: "missing _id" });
      }

      const index = issues.findIndex((issue) => issue._id === _id);

      if (index === -1) {
        return res.json({ error: "could not delete", _id: _id });
      }

      issues.splice(index, 1);
      res.json({ result: "successfully deleted", _id: _id });
    });
};
