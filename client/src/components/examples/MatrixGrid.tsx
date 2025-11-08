import MatrixGrid from '../MatrixGrid';

export default function MatrixGridExample() {
  const mockPositions = [
    { index: 1, address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7', level: 1, isCurrentUser: true, filled: true },
    { index: 2, address: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199', level: 2, filled: true },
    { index: 3, address: '0xAbCdEf1234567890aBcDeF1234567890AbCdEf12', level: 2, filled: true },
    { index: 4, address: '0x1234567890123456789012345678901234567890', level: 3, filled: true },
  ];

  return (
    <div className="max-w-md p-4">
      <MatrixGrid positions={mockPositions} maxLevel={5} />
    </div>
  );
}
