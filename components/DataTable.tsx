import React, { useState } from 'react';
import { TableRow } from '../types';
import { Plus, Trash2, Database, Dices } from 'lucide-react';

interface DataTableProps {
  data: TableRow[];
  onAdd: (row: TableRow) => void;
  onDelete: (id: number) => void;
}

const DataTable: React.FC<DataTableProps> = ({ data, onAdd, onDelete }) => {
  const [newId, setNewId] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newAge, setNewAge] = useState<string>('');
  const sortedData = [...data].sort((a, b) => a.id - b.id);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const idNum = parseInt(newId);
    const ageNum = parseInt(newAge);
    
    if (!isNaN(idNum) && !isNaN(ageNum) && newName) {
      onAdd({ id: idNum, name: newName, age: ageNum });
      setNewId('');
      setNewName('');
      setNewAge('');
    }
  };

  const handleRandomInsert = () => {
     const names = ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank', 'Grace', 'Hannah', 'Isaac', 'Jack', 'Kathy', 'Leo', 'Mia', 'Nathan', 'Oscar'];

     // Generate unique ID
     let id = 0;
     let attempts = 0;
     const maxId = data.length > 0 ? Math.max(...data.map(r => r.id)) : 0;

     // Expand range to 1-999
     do {
         id = Math.floor(Math.random() * 999) + 1;
         attempts++;
     } while (data.some(r => r.id === id) && attempts < 100);

     // Fallback: if 1-999 range is saturated, increase from maxId with offset
     if (attempts >= 100) {
         const offset = Math.floor(Math.random() * 100) + 1;
         id = maxId + offset;
     }

     const name = names[Math.floor(Math.random() * names.length)];
     const age = Math.floor(Math.random() * 43) + 18; // 18-60

     onAdd({ id, name, age });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-100 bg-gray-50 rounded-t-xl flex items-center justify-between">
        <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-800">表数据 (users)</h3>
        </div>
        <button 
           type="button"
           onClick={handleRandomInsert}
           className="text-xs bg-white border border-gray-200 hover:bg-gray-50 hover:text-indigo-600 text-gray-600 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-sm font-medium"
           title="随机生成一条数据"
        >
            <Dices className="w-4 h-4" />
            随机生成
        </button>
      </div>
      
      {/* Scrollable List */}
      <div className="flex-1 overflow-y-auto p-0">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0">
            <tr>
              <th className="px-4 py-3">ID (PK)</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Age</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
                <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-400 italic">
                        暂无数据。请添加记录。
                    </td>
                </tr>
            ) : (
                sortedData.map((row) => (
                <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-indigo-600">{row.id}</td>
                    <td className="px-4 py-3 text-gray-700">{row.name}</td>
                    <td className="px-4 py-3 text-gray-500">{row.age}</td>
                    <td className="px-4 py-3 text-right">
                    <button 
                        onClick={() => onDelete(row.id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
                        title="删除行"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    </td>
                </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      {/* Input Form */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
        <form onSubmit={handleAdd} className="flex flex-col gap-2">
           <div className="flex gap-2">
             <input
                type="number"
                placeholder="ID"
                value={newId}
                onChange={(e) => setNewId(e.target.value)}
                className="w-1/4 rounded-lg border-gray-300 border p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
             />
             <input
                type="text"
                placeholder="Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-1/2 rounded-lg border-gray-300 border p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
             />
             <input
                type="number"
                placeholder="Age"
                value={newAge}
                onChange={(e) => setNewAge(e.target.value)}
                className="w-1/4 rounded-lg border-gray-300 border p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
             />
           </div>
           <button 
             type="submit"
             disabled={!newId || !newName || !newAge}
             className="w-full bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
             <Plus className="w-4 h-4" />
             插入数据 (Insert)
           </button>
        </form>
      </div>
    </div>
  );
};

export default DataTable;
