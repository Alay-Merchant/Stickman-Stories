migrate((app) => {
  const users = new Collection({
    type: "auth",
    name: "studio_users",
    listRule: "id = @request.auth.id",
    viewRule: "id = @request.auth.id",
    createRule: "",
    updateRule: "id = @request.auth.id",
    deleteRule: "id = @request.auth.id",
  });
  app.save(users);

  const projects = new Collection({
    type: "base",
    name: "studio_projects",
    listRule: "owner = @request.auth.id",
    viewRule: "owner = @request.auth.id",
    createRule: "owner = @request.auth.id",
    updateRule: "owner = @request.auth.id",
    deleteRule: "owner = @request.auth.id",
    fields: [
      {name: "owner", type: "relation", required: true, maxSelect: 1, collectionId: users.id, cascadeDelete: true},
      {name: "local_id", type: "text", required: true, max: 128},
      {name: "title", type: "text", required: true, max: 200},
      {name: "status", type: "text", required: true, max: 40},
      {name: "target", type: "text", required: true, max: 40},
      {name: "rights_status", type: "text", required: true, max: 60},
      {name: "snapshot", type: "json", required: true, maxSize: 5_000_000},
      {name: "source_text", type: "text", max: 1_000_000},
      {name: "source_file", type: "file", maxSelect: 1, maxSize: 10_000_000, protected: true},
      {name: "artifacts", type: "file", maxSelect: 20, maxSize: 2_000_000_000, protected: true},
    ],
    indexes: ["CREATE UNIQUE INDEX idx_studio_projects_owner_local_id ON studio_projects (owner, local_id)"],
  });
  app.save(projects);

  const jobs = new Collection({
    type: "base",
    name: "studio_jobs",
    listRule: "owner = @request.auth.id",
    viewRule: "owner = @request.auth.id",
    createRule: "owner = @request.auth.id",
    updateRule: "owner = @request.auth.id",
    deleteRule: "owner = @request.auth.id",
    fields: [
      {name: "owner", type: "relation", required: true, maxSelect: 1, collectionId: users.id, cascadeDelete: true},
      {name: "project", type: "relation", required: true, maxSelect: 1, collectionId: projects.id, cascadeDelete: true},
      {name: "kind", type: "text", required: true, max: 40},
      {name: "status", type: "text", required: true, max: 40},
      {name: "detail", type: "json", maxSize: 1_000_000},
    ],
  });
  app.save(jobs);
}, (app) => {
  for (const name of ["studio_jobs", "studio_projects", "studio_users"]) {
    try { app.delete(app.findCollectionByNameOrId(name)); } catch { /* no-op */ }
  }
});
