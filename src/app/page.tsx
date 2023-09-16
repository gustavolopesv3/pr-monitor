"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { groupBy, map, orderBy, set } from "lodash";
import Image from "next/image";
import { Badge } from "@/components/badge";
import moment from "moment";

type Label = {
  id: number;
  node_id: string;
  url: string;
  name: string;
  color: string;
  default: boolean;
  description: string;
};

type PullRequestItem = {
  title: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  state: string;
  daysOponed: number;
  labels: Label[];
  user: {
    login: string;
    avatar_url: string;
  };
};

type PullRequest = {
  org: string;
  repo: string;
  items: PullRequestItem[];
};

export default function Home() {
  const [pullRequest, setPullRequest] = useState<PullRequest[]>([]);

  const session = useSession();

  function verfiyIfISLogged() {
    if (session.status !== "loading" && session.status !== "authenticated") {
      // redirec to login
      window.location.href = "/api/auth/signin";
    }
  }

  useEffect(() => {
    verfiyIfISLogged();
  }, [session]);

  async function getData() {
    if (session.status !== "authenticated") return;
    // @ts-ignore
    const token = session?.data?.accessToken?.accessToken;
    const resOrgs = await fetch("https://api.github.com/user/orgs", {
      headers: {
        Authorization: `token ${token}`,
      },
    }).then((res) => res.json());

    const resPullOrgs = await Promise.all(
      resOrgs.map((org: any) =>
        fetch(
          `https://api.github.com/search/issues?q=is:open+is:pr+org:${org.login}`,
          {
            headers: {
              Authorization: `token ${token}`,
            },
          }
        ).then((res) => res.json())
      )
    );

    const allPRs = map(resPullOrgs, (item) => item.items).flat();
    const groupedPRs = groupBy(allPRs, "repository_url");

    const data = map(groupedPRs, (value, key) => {
      const repo = key.split("/").slice(-1)[0];
      const org = key.split("/").slice(-2)[0];
      const items = value.map((item) => {
        return {
          title: item.title,
          url: item.html_url,
          createdAt: moment(item.created_at).format("DD/MM/YYYY"),
          updatedAt: moment(item.updated_at).format("DD/MM/YYYY"),
          daysOponed: moment().diff(moment(item.updated_at), "days"),
          state: item.state,
          labels: item.labels,
          user: {
            login: item.user.login,
            avatar_url: item.user.avatar_url,
          },
        };
      });
      return {
        org,
        repo,
        items: orderBy(items, ["daysOponed"], ["desc"]),
      };
    });

    setPullRequest(data);
  }

  function getColorDaysOpen(days: number) {
    if (days < 3) {
      return "bg-green-500";
    } else if (days < 7) {
      return "bg-yellow-500";
    } else {
      return "bg-red-500";
    }
  }

  useEffect(() => {
    getData();
  }, [session]);

  return (
    <div>
      <div>
        {pullRequest.map((organization, orgIndex) => (
          <div
            key={orgIndex}
            className="bg-gray-900 rounded-lg shadow-md p-4 m-10"
          >
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-200">
                Organização: {organization.org}
              </h2>
              <p className="text-gray-200">Repositório: {organization.repo}</p>
            </div>
            {organization.items.map((item, itemIndex) => (
              <div
                key={itemIndex}
                className="border-t border-gray-200 pt-4 mt-4"
              >
                <h3 className="text-lg font-semibold text-gray-200 flex gap-2">
                  Título: {item.title}{" "}
                  {map(item.labels, (label, index) => (
                    <Badge
                      key={index}
                      hexadecimal={label.color}
                      name={label.name}
                    />
                  ))}
                </h3>
                <p className="text-gray-200">
                  Dias:{" "}
                  <span className={getColorDaysOpen(item.daysOponed)}>
                    {item.daysOponed}
                  </span>
                </p>
                <p className="text-gray-200">
                  Link: <a className="text-blue-500 font-bold" href={item.url} target="_blank">{item.url}</a>
                </p>
                <p className="text-gray-200">
                  Data de criação: {item.createdAt}
                </p>
                <p className="text-gray-200">
                  Última atualização: {item.updatedAt}
                </p>
                <div className="flex items-center mt-2 flex-row">
                  <Image
                    src={item.user.avatar_url}
                    alt="avatar user"
                    width={30}
                    height={30}
                    style={{ borderRadius: "50%", marginRight: "5px" }}
                  />
                  <p className="text-gray-100 mr-2">
                    Responsável: {item.user.login}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
