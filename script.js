// 全局变量
let d = []; // 存储所有数据
let cl = ''; // 当前选中的列表ID
let dc = null; // 当前拖拽的卡片

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    loadData(); // 加载保存的数据
    renderBoard(); // 渲染看板
});

// 从localStorage加载数据
function loadData() {
    const saved = localStorage.getItem('kanban-data');
    if (saved) {
        d = JSON.parse(saved);
    } else {
        // 初始化默认数据
        d = [
            {
                id: 'todo',
                title: '待办事项',
                cards: [
                    { id: 'c1', text: '学习Vue.js基础' },
                    { id: 'c2', text: '完成项目文档' }
                ]
            },
            {
                id: 'doing',
                title: '进行中',
                cards: [
                    { id: 'c3', text: '开发看板功能' }
                ]
            },
            {
                id: 'done',
                title: '已完成',
                cards: [
                    { id: 'c4', text: '项目需求分析' }
                ]
            }
        ];
    }
}

// 保存数据到localStorage
function saveData() {
    localStorage.setItem('kanban-data', JSON.stringify(d));
}

// 渲染整个看板
function renderBoard() {
    const board = document.getElementById('board');
    
    // 清空现有内容，但保留添加列表按钮
    const addListBtn = board.querySelector('.al');
    board.innerHTML = '';
    
    // 渲染所有列表
    d.forEach(list => {
        renderList(list);
    });
    
    // 重新添加"添加列表"按钮
    board.appendChild(addListBtn);
}

// 渲染单个列表
function renderList(list) {
    const board = document.getElementById('board');
    
    // 创建列表容器
    const listDiv = document.createElement('div');
    listDiv.className = 'l';
    listDiv.id = list.id;
    
    // 列表标题
    const titleDiv = document.createElement('div');
    titleDiv.className = 'lt';
    titleDiv.innerHTML = `
        <h3>${list.title}</h3>
        <span class="count">${list.cards.length}</span>
    `;
    
    // 卡片容器
    const cardsDiv = document.createElement('div');
    cardsDiv.className = 'lc';
    cardsDiv.id = list.id + '-cards';
    
    // 渲染卡片
    if (list.cards.length === 0) {
        // 空列表提示
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'empty';
        emptyDiv.textContent = '暂无任务，点击下方按钮添加';
        cardsDiv.appendChild(emptyDiv);
    } else {
        list.cards.forEach(card => {
            const cardDiv = createCardElement(card);
            cardsDiv.appendChild(cardDiv);
        });
    }
    
    // 添加任务按钮
    const addDiv = document.createElement('div');
    addDiv.className = 'ab';
    addDiv.innerHTML = `<button class="abt" onclick="addCard('${list.id}')">+ 添加任务</button>`;
    
    // 组装列表
    listDiv.appendChild(titleDiv);
    listDiv.appendChild(cardsDiv);
    listDiv.appendChild(addDiv);
    
    // 添加拖拽事件监听
    setupDropZone(cardsDiv);
    
    // 插入到添加列表按钮之前
    const addListBtn = board.querySelector('.al');
    board.insertBefore(listDiv, addListBtn);
}

// 创建卡片元素
function createCardElement(card) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'c';
    cardDiv.draggable = true;
    cardDiv.id = card.id;

    // 创建卡片内容容器
    const contentDiv = document.createElement('div');
    contentDiv.className = 'cc';
    contentDiv.textContent = card.text;

    // 创建删除按钮
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'db';
    deleteBtn.innerHTML = '×';
    deleteBtn.title = '删除任务';
    deleteBtn.onclick = function(e) {
        e.stopPropagation();
        deleteCard(card.id);
    };

    // 组装卡片
    cardDiv.appendChild(contentDiv);
    cardDiv.appendChild(deleteBtn);

    // 添加拖拽事件
    cardDiv.addEventListener('dragstart', handleDragStart);
    cardDiv.addEventListener('dragend', handleDragEnd);

    return cardDiv;
}

// 设置放置区域
function setupDropZone(container) {
    container.addEventListener('dragover', handleDragOver);
    container.addEventListener('drop', handleDrop);
    container.addEventListener('dragenter', handleDragEnter);
    container.addEventListener('dragleave', handleDragLeave);
}

// 拖拽开始
function handleDragStart(e) {
    dc = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.outerHTML);
}

// 拖拽结束
function handleDragEnd(e) {
    this.classList.remove('dragging');
    dc = null;
    
    // 移除所有高亮
    document.querySelectorAll('.l').forEach(list => {
        list.classList.remove('drag-over');
    });
}

// 拖拽悬停
function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

// 拖拽进入
function handleDragEnter(e) {
    this.parentElement.classList.add('drag-over');
}

// 拖拽离开
function handleDragLeave(e) {
    this.parentElement.classList.remove('drag-over');
}

// 拖拽放置
function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    this.parentElement.classList.remove('drag-over');
    
    if (dc && dc !== this) {
        // 获取目标列表ID
        const targetListId = this.id.replace('-cards', '');
        const sourceListId = findCardList(dc.id);
        
        if (targetListId !== sourceListId) {
            // 移动卡片数据
            moveCard(dc.id, sourceListId, targetListId);
            
            // 重新渲染
            renderBoard();
            
            // 保存数据
            saveData();
        }
    }
    
    return false;
}

// 查找卡片所在的列表
function findCardList(cardId) {
    for (let list of d) {
        if (list.cards.find(card => card.id === cardId)) {
            return list.id;
        }
    }
    return null;
}

// 移动卡片
function moveCard(cardId, fromListId, toListId) {
    // 从源列表中移除卡片
    const fromList = d.find(list => list.id === fromListId);
    const cardIndex = fromList.cards.findIndex(card => card.id === cardId);
    const card = fromList.cards.splice(cardIndex, 1)[0];
    
    // 添加到目标列表
    const toList = d.find(list => list.id === toListId);
    toList.cards.push(card);
}

// 添加新任务
function addCard(listId) {
    cl = listId;
    document.getElementById('modal').style.display = 'flex';
    document.getElementById('taskInput').focus();
}

// 保存任务
function saveTask() {
    const input = document.getElementById('taskInput');
    const text = input.value.trim();
    
    if (text) {
        // 生成唯一ID
        const cardId = 'c' + Date.now();
        
        // 找到对应列表并添加卡片
        const list = d.find(l => l.id === cl);
        list.cards.push({
            id: cardId,
            text: text
        });
        
        // 重新渲染
        renderBoard();
        
        // 保存数据
        saveData();
        
        // 关闭弹窗
        closeModal();
    }
}

// 关闭任务弹窗
function closeModal() {
    document.getElementById('modal').style.display = 'none';
    document.getElementById('taskInput').value = '';
    cl = '';
}

// 添加新列表
function addList() {
    document.getElementById('listModal').style.display = 'flex';
    document.getElementById('listInput').focus();
}

// 保存列表
function saveList() {
    const input = document.getElementById('listInput');
    const title = input.value.trim();
    
    if (title) {
        // 生成唯一ID
        const listId = 'list' + Date.now();
        
        // 添加新列表
        d.push({
            id: listId,
            title: title,
            cards: []
        });
        
        // 重新渲染
        renderBoard();
        
        // 保存数据
        saveData();
        
        // 关闭弹窗
        closeListModal();
    }
}

// 关闭列表弹窗
function closeListModal() {
    document.getElementById('listModal').style.display = 'none';
    document.getElementById('listInput').value = '';
}

// 键盘事件处理
document.addEventListener('keydown', function(e) {
    // ESC键关闭弹窗
    if (e.key === 'Escape') {
        closeModal();
        closeListModal();
    }
    
    // Enter键保存
    if (e.key === 'Enter') {
        if (document.getElementById('modal').style.display === 'flex') {
            saveTask();
        } else if (document.getElementById('listModal').style.display === 'flex') {
            saveList();
        }
    }
});

// 删除卡片
function deleteCard(cardId) {
    if (confirm('确定要删除这个任务吗？')) {
        // 找到卡片所在的列表
        const listId = findCardList(cardId);
        const list = d.find(l => l.id === listId);

        // 从列表中移除卡片
        const cardIndex = list.cards.findIndex(card => card.id === cardId);
        list.cards.splice(cardIndex, 1);

        // 重新渲染
        renderBoard();

        // 保存数据
        saveData();
    }
}

// 点击弹窗外部关闭弹窗
document.getElementById('modal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});

document.getElementById('listModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeListModal();
    }
});
