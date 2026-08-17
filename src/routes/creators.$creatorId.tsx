import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Container } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { formatFollowers, getCreator, totalFollowers } from "@/lib/lookup";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/creators/$creatorId")({
  head: () => ({
    meta: [{ title: "Creator — NepCollab" }],
  }),
  component: CreatorProfilePage,
  notFoundComponent: () => (
    <Container>
      <EmptyState title="Creator not found" body="This profile may be private or removed." actionLabel="Browse creators" actionTo="/creators" />
    </Container>
  ),
});

function CreatorProfilePage() {
  useStore();
  const { creatorId } = Route.useParams();
  const creator = getCreator(creatorId);
  if (!creator) {
    throw notFound();
  }

  return (
    <Container className="max-w-3xl">
      <div className="overflow-hidden rounded-3xl border border-border bg-card">
        <div className="h-20 bg-gradient-to-r from-ink to-ink/80" />
        <div className="-mt-10 px-5 pb-6">
          <img src={creator.avatar} alt="" className="size-20 rounded-full border-4 border-card object-cover bg-muted" />
          <h1 className="mt-2 text-2xl font-bold tracking-tight">{creator.name}</h1>
          <p className="text-sm text-muted-foreground">
            @{creator.username || "—"} · {creator.location || "Nepal"}
            {creator.verified ? " · Verified" : ""}
          </p>
          <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
            {creator.bio || "Nepal creator on NepCollab."}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {(creator.niches || []).map((n) => (
              <span key={n} className="rounded-full bg-secondary px-2.5 py-1 text-[12px] font-medium">
                {n}
              </span>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-secondary/60 p-3">
              <p className="text-lg font-bold">{formatFollowers(totalFollowers(creator.id))}</p>
              <p className="text-[11px] text-muted-foreground">Followers</p>
            </div>
            <div className="rounded-2xl bg-secondary/60 p-3">
              <p className="text-lg font-bold">{creator.rating || "—"}</p>
              <p className="text-[11px] text-muted-foreground">Rating</p>
            </div>
            <div className="rounded-2xl bg-secondary/60 p-3">
              <p className="text-lg font-bold">{creator.completedCollaborations ?? 0}</p>
              <p className="text-[11px] text-muted-foreground">Collabs</p>
            </div>
          </div>
          {creator.socials?.length ? (
            <div className="mt-5">
              <h2 className="text-sm font-semibold">Socials</h2>
              <ul className="mt-2 space-y-2">
                {creator.socials.map((s) => (
                  <li key={`${s.platform}-${s.username}`} className="rounded-xl border border-border px-3 py-2 text-sm">
                    {s.platform} @{s.username} · {formatFollowers(s.followers)} · {s.engagement}% eng.
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <p className="mt-6 text-[12px] text-muted-foreground">
            Brands: create a campaign and collaborate after selection. NepCollab does not process payments — agree terms directly.
          </p>
          <Link to="/campaigns" className="mt-3 inline-flex text-sm font-semibold text-signal hover:underline">
            Browse campaigns →
          </Link>
        </div>
      </div>
    </Container>
  );
}
