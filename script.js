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
            // 1. localStorage에서 데이터 로드 시도
            const storedPlans = localStorage.getItem('internetPlans');
            if (storedPlans) {
                plansData = JSON.parse(storedPlans);
                // localStorage에 저장된 데이터에도 계산된 필드 추가 (혹시 이전 버전 데이터일 경우)
                plansData = plansData.map(plan => calculateFees(plan));
                console.log("Loaded plans from localStorage.", plansData);
            } else {
                // 2. localStorage에 데이터가 없으면 data.json에서 로드
                const response = await fetch('data.json');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const rawData = await response.json();
                plansData = rawData.map(plan => calculateFees(plan));
                // 처음 로드 시 localStorage에 저장
                localStorage.setItem('internetPlans', JSON.stringify(plansData));
                console.log("Loaded plans from data.json and saved to localStorage.", plansData);
            }
            applyFiltersAndRender();
        } catch (error) {
            console.error("Error loading plan data:", error);
            tableBody.innerHTML = `<tr><td colspan="11" class="text-center">데이터를 불러오는 데 실패했습니다.</td></tr>`;
        }
    }

    // 요금 계산 함수
    function calculateFees(plan) {
        const totalMonths = plan.contractYears * 12;
        // 선택 항목이 비어있을 경우 0으로 처리하여 계산 오류 방지
        const monthlyFee = plan.monthlyFee || 0;
        const setupFee = plan.setupFee || 0;
        const gift = plan.gift || 0;

        const totalFee = (monthlyFee * totalMonths) + setupFee;
        const realMonthlyFee = (totalFee - gift) / totalMonths;
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
                <td>${plan.seller || '-'}</td>
                <td><span class="badge bg-secondary">${plan.carrier}</span></td>
                <td>${plan.speed}Mbps</td>
                <td>${plan.tvChannels || '-'}개</td>
                <td>${plan.contractYears}년</td>
                <td>${plan.monthlyFee.toLocaleString()}원</td>
                <td>${plan.gift ? plan.gift.toLocaleString() + '원' : '-'}</td>
                <td>${plan.setupFee ? plan.setupFee.toLocaleString() + '원' : '-'}</td>
                <td>${plan.totalFee.toLocaleString()}원</td>
                <td><strong>${Math.round(plan.realMonthlyFee).toLocaleString()}원</strong></td>
                <td>
                    ${plan.url ? `<a href="${plan.url}" target="_blank" class="btn btn-sm btn-primary mb-1 btn-contact">웹사이트</a>` : ''}
                    ${plan.phone ? `<a href="tel:${plan.phone}" class="btn btn-sm btn-outline-secondary btn-contact">전화걸기</a>` : ''}
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

        // 입력 필드 값 가져오기 (선택 항목은 비어있을 경우 null 또는 0으로 처리)
        const newPlan = {
            seller: document.getElementById('inputSeller').value.trim() || null,
            carrier: document.getElementById('inputCarrier').value.trim(),
            speed: parseInt(document.getElementById('inputSpeed').value) || null,
            tvChannels: parseInt(document.getElementById('inputTvChannels').value) || null,
            contractYears: parseInt(document.getElementById('inputContractYears').value) || null,
            monthlyFee: parseInt(document.getElementById('inputMonthlyFee').value) || null,
            gift: parseInt(document.getElementById('inputGift').value) || null,
            setupFee: parseInt(document.getElementById('inputSetupFee').value) || null,
            url: document.getElementById('inputUrl').value.trim() || null,
            phone: document.getElementById('inputPhone').value.trim() || null
        };

        // 필수 항목 유효성 검사
        const requiredFields = [
            { id: 'inputCarrier', name: '통신사', type: 'string' },
            { id: 'inputSpeed', name: '인터넷 속도', type: 'number' },
            { id: 'inputContractYears', name: '약정기간', type: 'number' },
            { id: 'inputMonthlyFee', name: '월요금', type: 'number' }
        ];

        for (const field of requiredFields) {
            const value = document.getElementById(field.id).value.trim();
            if (value === '') {
                alert(`${field.name} 필드는 필수 항목입니다.`);
                return;
            }
            if (field.type === 'number' && isNaN(parseInt(value))) {
                alert(`${field.name} 필드는 숫자로 입력해주세요.`);
                return;
            }
        }

        // 계산된 값 추가
        const calculatedNewPlan = calculateFees(newPlan);
        plansData.push(calculatedNewPlan);
        applyFiltersAndRender();

        // 3. localStorage에 업데이트된 데이터 저장
        localStorage.setItem('internetPlans', JSON.stringify(plansData));

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
    }

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