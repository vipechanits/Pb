import BinaryTreeView from '../BinaryTreeView';

export default function BinaryTreeViewExample() {
  const mockTree = {
    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
    active: true,
    left: {
      address: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
      active: true,
      left: {
        address: '0x1234567890123456789012345678901234567890',
        active: false,
      },
    },
    right: {
      address: '0xAbCdEf1234567890aBcDeF1234567890AbCdEf12',
      active: true,
    },
  };

  return (
    <div className="p-4">
      <BinaryTreeView root={mockTree} />
    </div>
  );
}
