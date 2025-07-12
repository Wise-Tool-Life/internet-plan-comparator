document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('plan-table-body');
    const addPlanForm = document.getElementById('add-plan-form');

    let plansData = []; // 원본 데이터
    let filteredPlans = []; // 필터링된 데이터
    let currentSort = { column: 'real-monthly-fee', order: 'asc' };
    let currentFilters = { carrier: 'all', speed: 'all' };

    // 데이터 로드 및 테이블 렌더링
    async function loadPlans() {
        try {
            const response = await fetch('data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const rawData = await response.json();
            plansData = rawData.map(plan => calculateFees(plan));
            applyFiltersAndRender();
        } catch (error) {
            console.error("Error loading plan data:", error);
            tableBody.innerHTML = `<tr><td colspan="11" class="text-center">데이터를 불러오는 데 실패했습니다.</td></tr>`;
        }
    }

    // 요금 계산 함수
    function calculateFees(plan) {
        const totalMonths = plan.contractYears * 12;
        const totalFee = (plan.monthlyFee * totalMonths) + plan.setupFee;
        const realMonthlyFee = (totalFee - plan.gift) / totalMonths;
        return { ...plan, totalFee, realMonthlyFee };
    }

    // 테이블 렌더링 함수
    function renderTable(data) {
        tableBody.innerHTML = '';
        if (data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="11" class="text-center">해당 조건에 맞는 요금제가 없습니다.</td></tr>`;
            return;
        }

        data.forEach(plan => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${plan.seller}</td>
                <td><span class="badge bg-secondary">${plan.carrier}</span></td>
                <td>${plan.speed}Mbps</td>
                <td>${plan.tvChannels}개</td>
                <td>${plan.contractYears}년</td>
                <td>${plan.monthlyFee.toLocaleString()}원</td>
                <td>${plan.gift.toLocaleString()}원</td>
                <td>${plan.setupFee.toLocaleString()}원</td>
                <td>${plan.totalFee.toLocaleString()}원</td>
                <td><strong>${Math.round(plan.realMonthlyFee).toLocaleString()}원</strong></td>
                <td>
                    <a href="${plan.url}" target="_blank" class="btn btn-sm btn-primary mb-1 btn-contact">웹사이트</a>
                    <a href="tel:${plan.phone}" class="btn btn-sm btn-outline-secondary btn-contact">전화걸기</a>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    // 필터링 로직
    function filterPlans(data) {
        return data.filter(plan => {
            const carrierMatch = currentFilters.carrier === 'all' || plan.carrier === currentFilters.carrier;
            const speedMatch = currentFilters.speed === 'all' || plan.speed === parseInt(currentFilters.speed);
            return carrierMatch && speedMatch;
        });
    }

    // 필터 적용 및 렌더링
    function applyFiltersAndRender() {
        filteredPlans = filterPlans(plansData);
        sortData(filteredPlans, currentSort.column, currentSort.order);
        renderTable(filteredPlans);
    }

    // 필터 버튼 이벤트 리스너
    document.getElementById('carrier-filter').addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            document.querySelectorAll('#carrier-filter .btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            currentFilters.carrier = e.target.dataset.carrier;
            applyFiltersAndRender();
        }
    });

    document.getElementById('speed-filter').addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            document.querySelectorAll('#speed-filter .btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            currentFilters.speed = e.target.dataset.speed;
            applyFiltersAndRender();
        }
    });

    // 새 요금제 추가 폼 제출 이벤트 리스너
    addPlanForm.addEventListener('submit', (e) => {
        e.preventDefault(); // 폼 기본 제출 동작 방지

        const newPlan = {
            seller: document.getElementById('inputSeller').value,
            carrier: document.getElementById('inputCarrier').value,
            speed: parseInt(document.getElementById('inputSpeed').value),
            tvChannels: parseInt(document.getElementById('inputTvChannels').value),
            contractYears: parseInt(document.getElementById('inputContractYears').value),
            monthlyFee: parseInt(document.getElementById('inputMonthlyFee').value),
            gift: parseInt(document.getElementById('inputGift').value),
            setupFee: parseInt(document.getElementById('inputSetupFee').value),
            url: document.getElementById('inputUrl').value,
            phone: document.getElementById('inputPhone').value
        };

        // 간단한 유효성 검사 (필수 필드 확인)
        for (const key in newPlan) {
            if (key !== 'url' && key !== 'phone' && (newPlan[key] === '' || isNaN(newPlan[key]))) {
                alert(`${key} 필드를 올바르게 입력해주세요.`);
                return;
            }
        }

        // 계산된 값 추가
        const calculatedNewPlan = calculateFees(newPlan);
        plansData.push(calculatedNewPlan);
        applyFiltersAndRender();

        // 폼 초기화
        addPlanForm.reset();
    });

    // 정렬 기능
    document.querySelectorAll('.sortable').forEach(header => {
        header.addEventListener('click', () => {
            const column = header.dataset.sort;
            const order = (currentSort.column === column && currentSort.order === 'asc') ? 'desc' : 'asc';
            currentSort = { column, order };

            sortData(filteredPlans, column, order);
            renderTable(filteredPlans);
            updateSortIcons();
        });
    });

    function sortData(data, column, order) {
        data.sort((a, b) => {
            const valA = column === 'monthly-fee' ? a.monthlyFee : column === 'gift' ? a.gift : column === 'total-fee' ? a.totalFee : a.realMonthlyFee;
            const valB = column === 'monthly-fee' ? b.monthlyFee : column === 'gift' ? b.gift : column === 'total-fee' ? b.totalFee : b.realMonthlyFee;
            return order === 'asc' ? valA - valB : valB - valA;
        });
    }

    function updateSortIcons() {
        document.querySelectorAll('.sortable').forEach(header => {
            header.classList.remove('sorted-asc', 'sorted-desc');
            if (header.dataset.sort === currentSort.column) {
                header.classList.add(currentSort.order === 'asc' ? 'sorted-asc' : 'sorted-desc');
            }
        });
    }

    // 초기 데이터 로드
    loadPlans();
});