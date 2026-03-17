import { useNavigate } from "react-router-dom";
import { PlusCircle, Pencil, Trash2, Layers } from "lucide-react";
import { useMyModules, useDeleteModule } from "../hooks/useModules.js";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";
import Badge from "../components/ui/Badge.jsx";

const PHASE_LABELS = {
  WARMUP: "Warm-up",
  MAIN: "Main Part",
  GAME: "Game",
  COOLDOWN: "Cool-down",
};

const PHASE_COLORS = {
  WARMUP: {
    bg: "#c8f13522",
    border: "#c8f13566",
    color: "var(--color-accent)",
  },
  MAIN: { bg: "#4a9eff22", border: "#4a9eff66", color: "#4a9eff" },
  GAME: { bg: "#00d68f22", border: "#00d68f66", color: "var(--color-success)" },
  COOLDOWN: {
    bg: "#7a849922",
    border: "#7a849966",
    color: "var(--color-text-muted)",
  },
};

export default function ModuleList() {
  const navigate = useNavigate();
  const { data: modules, isLoading } = useMyModules();
  const deleteModule = useDeleteModule();

  async function handleDelete(e, id) {
    e.stopPropagation();
    if (!confirm("Delete this module? This action cannot be undone.")) return;
    await deleteModule.mutateAsync(id);
  }

  const grouped = {};
  for (const phase of ["WARMUP", "MAIN", "GAME", "COOLDOWN"]) {
    grouped[phase] = (modules ?? []).filter((m) => m.phase_type === phase);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1
            className="text-4xl tracking-wide mb-2"
            style={{
              fontFamily: '"Bebas Neue", cursive',
              color: "var(--color-text)",
            }}
          >
            Training Modules
          </h1>
          <p style={{ color: "var(--color-text-muted)" }}>
            Reusable phase blocks you can insert into any session.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate("/modules/new")}
          className="flex items-center gap-1.5"
        >
          <PlusCircle className="w-4 h-4" />
          New Module
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-xl animate-pulse"
              style={{ backgroundColor: "var(--color-surface)" }}
            />
          ))}
        </div>
      ) : (modules ?? []).length === 0 ? (
        <div
          className="text-center py-20 rounded-2xl border"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-surface)",
          }}
        >
          <div className="text-5xl mb-4">📦</div>
          <p
            className="text-xl font-semibold mb-2"
            style={{ color: "var(--color-text)" }}
          >
            No modules yet
          </p>
          <p className="mb-6" style={{ color: "var(--color-text-muted)" }}>
            Create reusable phase blocks to build sessions faster.
          </p>
          <Button variant="primary" onClick={() => navigate("/modules/new")}>
            <PlusCircle className="w-4 h-4" />
            Create Module
          </Button>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(grouped).map(([phase, items]) => {
            if (items.length === 0) return null;
            const colors = PHASE_COLORS[phase];
            return (
              <section key={phase}>
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className="text-xs font-mono font-bold uppercase px-2.5 py-1 rounded-full"
                    style={{
                      backgroundColor: colors.bg,
                      border: `1px solid ${colors.border}`,
                      color: colors.color,
                    }}
                  >
                    {PHASE_LABELS[phase]}
                  </span>
                  <span
                    className="text-sm"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {items.length} module{items.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="space-y-3">
                  {items.map((module) => (
                    <Card key={module.id} hoverable>
                      <div className="flex flex-wrap items-center gap-3">
                        <div
                          className="flex-1 min-w-0"
                          onClick={() => navigate(`/modules/${module.id}/edit`)}
                          style={{ cursor: "pointer" }}
                        >
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span
                              className="font-semibold truncate"
                              style={{ color: "var(--color-text)" }}
                            >
                              {module.title}
                            </span>
                            {module.is_public && <Badge>Public</Badge>}
                          </div>
                          <div
                            className="flex items-center gap-3 text-xs"
                            style={{ color: "var(--color-text-muted)" }}
                          >
                            <span className="flex items-center gap-1">
                              <Layers className="w-3 h-3" />
                              {module.drills.length} drill
                              {module.drills.length !== 1 ? "s" : ""}
                            </span>
                            {module.description && (
                              <span className="truncate max-w-xs">
                                {module.description}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/modules/${module.id}/edit`);
                            }}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            loading={deleteModule.isPending}
                            onClick={(e) => handleDelete(e, module.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
