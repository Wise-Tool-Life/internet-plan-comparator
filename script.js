const SUPABASE_URL = 'https://gerymbwresrlgdoymdev.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlcnltYndyZXNybGdkb3ltZGV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzMjE2MjAsImV4cCI6MjA2Nzg5NzYyMH0.efufTU6bjgn09A9wX_xPbSJIUQrLfFn9SROD6jtWJ4s';

let supabase;

function initApp() {
    supabase = Supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const tableBody = document.getElementById('plan-table-body');
    const addPlanForm = document.getElementById('add-plan-form');

    let plansData = []; // 원본 데이터
    let filteredPlans = []; // 필터링된 데이터
    let currentSort = { column: 'real-monthly-fee', order: 'asc' };
    let currentFilters = { carrier: 'all', speed: 'all' };

    // 데이터 로드 및 테이블 렌더링
    async function loadPlans() {
        try {
            // Supabase에서 데이터 불러오기
            const { data, error } = await supabase
                .from('internet_plans') // 테이블 이름
                .select('*');

            if (error) {
                throw error;
            }

            plansData = data.map(plan => calculateFees(plan));
            applyFiltersAndRender();
            console.log("Loaded plans from Supabase.", plansData);

        } catch (error) {
            console.error("Error loading plan data from Supabase:", error.message);
            tableBody.innerHTML = `<tr><td colspan="11" class="text-center">데이터를 불러오는 데 실패했습니다. Supabase 연결 또는 테이블 설정을 확인해주세요.</td></tr>`;
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
    addPlanForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // 폼 기본 제출 동작 방지

        // 입력 필드 값 가져오기 (선택 항목은 비어있을 경우 null 또는 0으로 처리)
        const newPlan = {
            seller: document.getElementById('inputSeller').value.trim() || null,
            carrier: document.getElementById('inputCarrier').value.trim(),
            speed: parseInt(document.getElementById('inputSpeed').value) || 0, // null 대신 0으로 변경
            tvChannels: parseInt(document.getElementById('inputTvChannels').value) || 0, // null 대신 0으로 변경
            contractYears: parseInt(document.getElementById('inputContractYears').value) || 0, // null 대신 0으로 변경
            monthlyFee: parseInt(document.getElementById('inputMonthlyFee').value) || 0, // null 대신 0으로 변경
            gift: parseInt(document.getElementById('inputGift').value) || 0, // null 대신 0으로 변경
            setupFee: parseInt(document.getElementById('inputSetupFee').value) || 0, // null 대신 0으로 변경
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

        console.log("Attempting to add new plan:", newPlan);

        try {
            // Supabase에 새 요금제 삽입
            const { data, error } = await supabase
                .from('internet_plans')
                .insert([newPlan])
                .select(); // 삽입된 데이터 반환

            if (error) {
                throw error;
            }

            console.log("New plan added to Supabase successfully:", data);

            // 삽입된 데이터를 plansData에 추가하고 다시 렌더링
            // Supabase에서 반환된 데이터는 이미 계산된 필드가 없으므로 다시 계산
            plansData.push(calculateFees(data[0]));
            applyFiltersAndRender();

            // 폼 초기화
            addPlanForm.reset();

        } catch (error) {
            console.error("Error adding new plan to Supabase:", error.message, error);
            alert(`요금제 추가 실패: ${error.message}\n자세한 내용은 콘솔을 확인해주세요.`);
        }
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
}