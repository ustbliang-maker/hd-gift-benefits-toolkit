(() => {
  const $ = (id) => document.getElementById(id);
  const ids = ['scene','people','reserve','deadline','cityCount','siteCount','budget','product','packaging','shipping','fixed'];
  const numericIds = ['people','reserve','cityCount','siteCount','budget','product','packaging','shipping','fixed'];
  const num = (id) => { const raw = $(id).value.trim(); return raw === '' ? null : Number(raw); };
  const money = (value) => value === null || !Number.isFinite(value) ? '待确认' : `${value.toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2})} 元`;
  const safeText = (id, fallback = '待确认') => $(id).value.trim() || fallback;

  function update() {
    const people = num('people');
    const reserve = num('reserve') ?? 0;
    const valid = people !== null && Number.isInteger(people) && people > 0 && Number.isInteger(reserve) && reserve >= 0;
    const qty = valid ? people + reserve : null;
    const unitParts = ['product','packaging','shipping'].map(num);
    const hasUnitCost = unitParts.some(v => v !== null);
    const knownUnitCost = unitParts.reduce((sum,v) => sum + (v ?? 0),0);
    const fixed = num('fixed');
    const hasEstimate = hasUnitCost || fixed !== null;
    const total = qty !== null && hasEstimate ? qty * knownUnitCost + (fixed ?? 0) : null;
    const perPerson = total !== null && people ? total / people : null;
    $('qtyResult').textContent = qty === null ? '—' : `${qty.toLocaleString('zh-CN')} 份`;
    $('totalResult').textContent = money(total);
    $('perPersonResult').textContent = money(perPerson);
    const budget = num('budget');
    const status = $('budgetStatus');
    status.className = 'budget-status';
    if (budget !== null && total !== null) {
      const diff = budget - total;
      status.textContent = diff >= 0 ? `低于预算上限 ${money(diff)}` : `高于预算上限 ${money(Math.abs(diff))}`;
      status.classList.add(diff >= 0 ? 'under' : 'over');
    } else if (budget !== null) status.textContent = `已记录预算上限 ${money(budget)}；填写费用后可对照`;
    else status.textContent = '填写人数与预算项后查看估算';
    const included = [...document.querySelectorAll('input[name="included"]:checked')].map(el => el.value);
    const lines = [
      `福利场景：${safeText('scene')}`,
      `员工人数：${valid ? people.toLocaleString('zh-CN') + ' 人' : '待填写（需为正整数）'}`,
      `备用份数：${Number.isInteger(reserve) && reserve >= 0 ? reserve.toLocaleString('zh-CN') + ' 份' : '待确认'}`,
      `建议准备份数：${qty === null ? '待确认' : qty.toLocaleString('zh-CN') + ' 份'}`,
      `预算上限：${money(budget)}`,
      `预算包含项：${included.length ? included.join('、') : '待确认'}`,
      `按已填写费用估算：${money(total)}（非正式报价）`,
      `最晚到货日期：${safeText('deadline')}`,
      `配送城市数：${safeText('cityCount')}`,
      `接收点/地址数量：${safeText('siteCount')}`,
      '',
      '备注：价格、税费、起订量、产品配置和交期须按项目书面确认；不要在此摘要中添加个人收件信息。'
    ];
    $('summary').textContent = lines.join('\n');
    return {valid,qty,total,perPerson,budget,lines,included};
  }

  function csvCell(value) { return `"${String(value ?? '').replaceAll('"','""')}"`; }
  function downloadCsv() {
    const state = update();
    const rows = [['字段','内容'],...state.lines.map(line => { const at=line.indexOf('：'); return [line.slice(0,at),line.slice(at+1)]; })];
    const csv = '\ufeff' + rows.map(row => row.map(csvCell).join(',')).join('\r\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
    link.download = 'HD-GIFT-福利采购需求摘要.csv';
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href),1000);
    $('feedback').textContent = 'CSV已在本机生成并下载。';
  }
  async function copySummary() {
    const text = update().lines.join('\n');
    try { await navigator.clipboard.writeText(text); }
    catch { const area=document.createElement('textarea'); area.value=text; document.body.append(area); area.select(); document.execCommand('copy'); area.remove(); }
    $('feedback').textContent = '摘要已复制。';
  }
  ids.forEach(id => $(id).addEventListener('input',update));
  document.querySelectorAll('input[name="included"]').forEach(el => el.addEventListener('change',update));
  $('copyBtn').addEventListener('click',copySummary);
  $('csvBtn').addEventListener('click',downloadCsv);
  $('printBtn').addEventListener('click',() => window.print());
  update();
})();
