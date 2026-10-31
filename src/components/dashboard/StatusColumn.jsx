import React from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StatusColumn({ status, items }) {
  const Icon = status.icon;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className={`w-4 h-4 ${status.accent}`} />
          {status.label}
          <Badge variant="secondary" className="ml-auto">
            {items.length}
          </Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">{status.description}</p>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground py-3">Nothing here yet.</p>
        ) : (
          items.map((item) => (
            <Link
              key={item.id}
              to={`/workspace?analysis=${item.id}`}
              className="block rounded-lg border px-3 py-2 hover:bg-accent transition-colors"
            >
              <p className="text-sm font-medium truncate">{item.title}</p>
              <p className="text-xs text-muted-foreground truncate">{item.url}</p>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}