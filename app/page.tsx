import { TreeNode } from "./components/TreeNode";
import { TreeNode as TreeNodeType } from "./types/node";

const sampleData: TreeNodeType = {
  id: "1",
  text: "プロジェクト計画",
  children: [
    {
      id: "2",
      text: "要件定義",
      children: [
        {
          id: "3",
          text: "機能要件",
        },
        {
          id: "4",
          text: "非機能要件",
        }
      ]
    },
    {
      id: "5",
      text: "設計",
      children: [
        {
          id: "6",
          text: "UI設計",
          color: "#e6f3ff"
        },
        {
          id: "7",
          text: "データベース設計",
          color: "#fff3e6"
        }
      ]
    },
    {
      id: "8",
      text: "開発",
      children: [
        {
          id: "9",
          text: "フロントエンド",
        },
        {
          id: "10",
          text: "バックエンド",
        }
      ]
    }
  ]
};

export default function Home() {
  return (
    <div className="p-4">
      <TreeNode node={sampleData} />
    </div>
  );
}
