import { useQuery } from "@tanstack/react-query";
import { roleReadinessApi } from "../api/roleReadiness";

export const useRoleReadiness = (role = "software-engineer") =>
  useQuery({
    queryKey: ["roleReadiness", role],
    queryFn: () => roleReadinessApi.getReadiness(role),
    staleTime: 60_000,
  });
