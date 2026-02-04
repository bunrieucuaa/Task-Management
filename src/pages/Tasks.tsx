import { Button } from "@/components/ui/button";
import { FilePlus } from "lucide-react";
import { Flex, Space, Table, Tag } from "antd";
import type { TableProps } from "antd";

export default function Tasks() {
  interface DataType {
    key: string;
    name: string;
    age: number;
    address: string;
    tags: string[];
  }

  const columns: TableProps<DataType>["columns"] = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text) => <a>{text}</a>,
    },
    {
      title: "Age",
      dataIndex: "age",
      key: "age",
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
    },
    {
      title: "Tags",
      key: "tags",
      dataIndex: "tags",
      render: (_, { tags }) => (
        <Flex gap="small" align="center" wrap>
          {tags.map((tag) => {
            let color = tag.length > 5 ? "geekblue" : "green";
            if (tag === "loser") {
              color = "volcano";
            }
            return (
              <Tag color={color} key={tag}>
                {tag.toUpperCase()}
              </Tag>
            );
          })}
        </Flex>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <a>Invite {record.name}</a>
          <a>Delete</a>
        </Space>
      ),
    },
  ];

  const data: DataType[] = [
    {
      key: "1",
      name: "John Brown",
      age: 32,
      address: "New York No. 1 Lake Park",
      tags: ["nice", "developer"],
    },
    {
      key: "2",
      name: "Jim Green",
      age: 42,
      address: "London No. 1 Lake Park",
      tags: ["loser"],
    },
    {
      key: "3",
      name: "Joe Black",
      age: 32,
      address: "Sydney No. 1 Lake Park",
      tags: ["cool", "teacher"],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-gray-900">
          Tasks Management
        </h1>

        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Description */}
          <div className="max-w-3xl text-sm text-gray-600 leading-relaxed">
            Manage your tasks efficiently with this simple task management
            system.
          </div>

          {/* Actions */}
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" size="lg" className="custom-button">
              <FilePlus className="h-4 w-4" /> Create
            </Button>
          </div>
        </div>
      </div>
      {/* Content */}
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <Table<DataType> columns={columns} dataSource={data} />
      </div>
    </div>
  );
}
