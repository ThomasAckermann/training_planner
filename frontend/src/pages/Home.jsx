import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useDrills } from "../hooks/useDrills.js";
import { useFeed } from "../hooks/useUsers.js";
import useAuthStore from "../store/authStore.js";
import DrillCard from "../components/drill/DrillCard.jsx";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";
import Badge from "../components/ui/Badge.jsx";

function SkeletonCard() {
  return (
    <Card>
      <div className="animate-pulse space-y-3">
        <div className="flex gap-2">
          <div className="h-5 w-16 bg-surface2 rounded-full" />
          <div className="h-5 w-20 bg-surface2 rounded-full" />
        </div>
        <div className="h-5 w-3/4 bg-surface2 rounded" />
        <div className="h-4 w-full bg-surface2 rounded" />
        <div className="h-4 w-2/3 bg-surface2 rounded" />
        <div className="flex gap-4">
          <div className="h-3 w-16 bg-surface2 rounded" />
          <div className="h-3 w-20 bg-surface2 rounded" />
        </div>
      </div>
    </Card>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const [feedTab, setFeedTab] = useState("latest");
  const { data, isLoading } = useDrills({ limit: 6, is_public: true });
  const drills = data?.items ?? [];
  const { data: feedData } = useFeed();

  return (
    <div>
      {/* Hero */}
      <section
        className="relative overflow-hidden py-24 px-4"
        style={{
          background:
            "linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 50%, #0d0d0d 100%)",
        }}
      >
        {/* Background accent */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "radial-gradient(circle at 70% 50%, #cc1414 0%, transparent 60%)",
          }}
        />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                backgroundColor: "#cc141422",
                border: "1px solid #cc141444",
              }}
            >
              <span className="text-3xl">🏐</span>
            </div>
          </div>
          <h1
            className="text-5xl sm:text-7xl mb-4 tracking-wide"
            style={{
              fontFamily: '"Bebas Neue", cursive',
              color: "var(--color-text)",
            }}
          >
            Build Better{" "}
            <span style={{ color: "var(--color-accent)" }}>Training</span>{" "}
            Sessions
          </h1>
          <p
            className="text-lg sm:text-xl mb-10 max-w-2xl mx-auto"
            style={{ color: "var(--color-text-muted)" }}
          >
            A professional tool for volleyball coaches to design, organize, and
            share drill libraries and training sessions.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              size="lg"
              variant="primary"
              onClick={() => navigate("/explore")}
            >
              Explore Drills
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate("/drills/new")}
            >
              Create Drill
            </Button>
          </div>
        </div>
      </section>

      {/* Feed (for logged-in users who follow coaches) */}
      {currentUser && (feedData?.following_count ?? 0) > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
          <div className="flex items-center justify-between mb-6">
            <h2
              className="text-3xl tracking-wide"
              style={{
                fontFamily: '"Bebas Neue", cursive',
                color: "var(--color-text)",
              }}
            >
              Your Feed
            </h2>
            <div
              className="flex gap-1 p-1 rounded-lg border"
              style={{
                backgroundColor: "var(--color-surface)",
                borderColor: "var(--color-border)",
              }}
            >
              {["drills", "sessions"].map((key) => (
                <button
                  key={key}
                  onClick={() => setFeedTab(key)}
                  className="px-3 py-1 rounded text-sm font-medium transition-colors capitalize"
                  style={{
                    backgroundColor:
                      feedTab === key
                        ? "var(--color-surface-2)"
                        : "transparent",
                    color:
                      feedTab === key
                        ? "var(--color-text)"
                        : "var(--color-text-muted)",
                    border:
                      feedTab === key
                        ? "1px solid var(--color-border)"
                        : "1px solid transparent",
                  }}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>

          {feedTab === "drills" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {(feedData?.drills ?? []).length === 0 ? (
                <p
                  className="col-span-3 text-sm text-center py-8"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  No recent drills from coaches you follow.
                </p>
              ) : (
                (feedData?.drills ?? []).map((drill) => (
                  <DrillCard key={drill.id} drill={drill} />
                ))
              )}
            </div>
          )}

          {feedTab === "sessions" && (
            <div className="space-y-3 mb-4">
              {(feedData?.sessions ?? []).length === 0 ? (
                <p
                  className="text-sm text-center py-8"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  No recent sessions from coaches you follow.
                </p>
              ) : (
                (feedData?.sessions ?? []).map((session) => (
                  <Card
                    key={session.id}
                    hoverable
                    className="cursor-pointer"
                    onClick={() => navigate(`/sessions/${session.id}`)}
                  >
                    <p
                      className="font-semibold"
                      style={{ color: "var(--color-text)" }}
                    >
                      {session.title}
                    </p>
                    <div className="flex gap-2 mt-1">
                      {session.skill_level && (
                        <Badge variant="skill">{session.skill_level}</Badge>
                      )}
                      {session.age_range && (
                        <Badge variant="age">{session.age_range}</Badge>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
        </section>
      )}

      {/* Latest drills */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2
            className="text-3xl tracking-wide"
            style={{
              fontFamily: '"Bebas Neue", cursive',
              color: "var(--color-text)",
            }}
          >
            Latest Drills
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/explore")}
          >
            View all
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : drills.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {drills.map((drill) => (
              <DrillCard key={drill.id} drill={drill} />
            ))}
          </div>
        ) : (
          <div
            className="text-center py-20 rounded-xl border"
            style={{
              borderColor: "var(--color-border)",
              backgroundColor: "var(--color-surface)",
            }}
          >
            <div className="text-4xl mb-3">🏐</div>
            <p
              className="text-lg font-medium mb-2"
              style={{ color: "var(--color-text-primary)" }}
            >
              No drills yet
            </p>
            <p className="mb-6" style={{ color: "var(--color-text-muted)" }}>
              Be the first to create a drill!
            </p>
            <Button variant="primary" onClick={() => navigate("/drills/new")}>
              Create the first drill
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
