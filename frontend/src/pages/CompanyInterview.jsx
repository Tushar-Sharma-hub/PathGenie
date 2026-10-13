import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiBriefcase, FiCheckCircle, FiClock, FiLoader, FiMessageSquare } from "react-icons/fi";
import { useSelector } from "react-redux";
import api from "../utils/axios";

const COMPANIES = [
  "Amazon",
  "Google",
  "Microsoft",
  "Meta",
  "Apple",
  "Netflix",
  "NVIDIA",
  "Adobe",
  "Atlassian",
  "Infosys",
  "TCS",
  "Wipro",
  "Accenture",
  "Other",
];

function CompanyInterview({ setUser }) {
  const navigate = useNavigate();
  const { resume } = useSelector((state) => state.resume);
  const [company, setCompany] = useState(COMPANIES[0]);
  const [customCompany, setCustomCompany] = useState("");
  const [role, setRole] = useState("");
  const [type, setType] = useState("technical");
  const [useResume, setUseResume] = useState(Boolean(resume));
  const [interview, setInterview] = useState(null);
  const [answer, setAnswer] = useState("");
  const [lastFeedback, setLastFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [history, setHistory] = useState([]);
  const [selectedHistory, setSelectedHistory] = useState(null);

  const toggleHistory = async () => {
    if (historyOpen) {
      setHistoryOpen(false);
      setSelectedHistory(null);
      return;
    }

    setHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const response = await api.get("/api/company-interview/all");
      setHistory(response.data.interviews);
    } catch (requestError) {
      console.error("Failed to load company interview history:", requestError);
      setHistoryError(requestError.response?.data?.message || "Could not load interview history.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const openHistoryItem = async (id) => {
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const response = await api.get(`/api/company-interview/${id}`);
      setSelectedHistory(response.data.interview);
    } catch (requestError) {
      console.error("Failed to load company interview history item:", requestError);
      setHistoryError(requestError.response?.data?.message || "Could not load this interview.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const startInterview = async (event) => {
    event.preventDefault();
    const selectedCompany = company === "Other" ? customCompany.trim() : company;
    if (!selectedCompany || !role.trim() || loading) return;

    setLoading(true);
    setError("");
    let charged = false;
    try {
      const coinResponse = await api.post("/api/auth/use-coins", {
        coins: 50,
        action: "company-interview",
      });
      charged = true;
      setUser((current) => ({ ...current, interviewCoin: coinResponse.data.interviewCoin }));

      const response = await api.post("/api/company-interview/start", {
        company: selectedCompany,
        role: role.trim(),
        type,
        useResume: useResume && Boolean(resume),
        resume: useResume ? resume : {},
      });
      setInterview(response.data.interview);
    } catch (requestError) {
      console.error("Failed to start company interview:", requestError);
      if (charged) {
        try {
          const refund = await api.post("/api/auth/add-coins", { coins: 50 });
          setUser((current) => ({ ...current, interviewCoin: refund.data.interviewCoin }));
        } catch (refundError) {
          console.error("Failed to refund company interview coins:", refundError);
          setError("Could not start the interview, and the coin refund failed. Please contact support.");
          setLoading(false);
          return;
        }
      }
      setError(requestError.response?.data?.message || "Could not start the interview. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async (event) => {
    event.preventDefault();
    if (!answer.trim() || loading) return;
    setLoading(true);
    setError("");
    try {
      const response = await api.post("/api/company-interview/answer", {
        interviewId: interview._id,
        answer: answer.trim(),
      });
      setInterview(response.data.interview);
      setHistory((current) => current.map((item) =>
        item._id === response.data.interview._id
          ? { ...item, ...response.data.interview }
          : item
      ));
      setLastFeedback(response.data.feedback);
      setAnswer("");
    } catch (requestError) {
      console.error("Failed to submit company interview answer:", requestError);
      setError(requestError.response?.data?.message || "Could not evaluate your answer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setInterview(null);
    setLastFeedback(null);
    setAnswer("");
    setError("");
  };

  return (
    <div className="min-h-screen bg-[#f7f7f8] px-4 py-6 text-[#111] sm:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <button onClick={() => navigate("/dashboard")} className="inline-flex items-center gap-2 text-sm text-black/55 hover:text-black">
            <FiArrowLeft /> Dashboard
          </button>
          <button onClick={toggleHistory} className="inline-flex h-10 items-center gap-2 rounded-xl border border-black/10 bg-white px-4 text-sm font-medium hover:border-black/30">
            <FiClock /> {historyOpen ? "Back to simulator" : "Interview history"}
          </button>
        </div>

        {historyOpen ? (
          <section className="rounded-3xl border border-black/8 bg-white p-6 shadow-sm sm:p-9">
            {selectedHistory ? (
              <>
                <button onClick={() => setSelectedHistory(null)} className="mb-5 text-sm text-black/55 hover:text-black">← All company interviews</button>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-black/40">
                      {selectedHistory.company} · {selectedHistory.type} · {new Date(selectedHistory.createdAt).toLocaleDateString()}
                    </p>
                    <h1 className="mt-1 text-2xl font-bold">{selectedHistory.role}</h1>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs capitalize ${selectedHistory.status === "completed" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                    {selectedHistory.status === "completed" ? `Score ${selectedHistory.overallScore}/100` : "In progress"}
                  </span>
                </div>

                <div className="mt-6 space-y-4">
                  {selectedHistory.questions.map((item, index) => (
                    <article key={`${selectedHistory._id}-${index}`} className="rounded-2xl border border-black/8 p-4 sm:p-5">
                      <div className="flex items-center justify-between gap-3">
                        <h2 className="font-semibold">Question {index + 1}</h2>
                        <span className="text-xs capitalize text-black/40">{item.difficulty}{Number.isFinite(item.feedback?.score) && item.feedback.score > 0 ? ` · ${item.feedback.score}/100` : ""}</span>
                      </div>
                      <p className="mt-3 leading-6">{item.question}</p>
                      <div className="mt-4 grid gap-3">
                        <div className="rounded-xl bg-black/3 p-4">
                          <h3 className="text-xs font-semibold uppercase tracking-wide text-black/45">Your answer</h3>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-black/70">{item.userAnswer || "Not answered yet."}</p>
                        </div>
                        <div className="rounded-xl bg-blue-50/70 p-4">
                          <h3 className="text-xs font-semibold uppercase tracking-wide text-blue-900/60">Example strong answer</h3>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-black/70">{item.idealAnswer || "No reference answer is available for this older interview."}</p>
                        </div>
                        {item.feedback?.feedback && <p className="text-sm leading-6 text-black/55"><strong>Feedback:</strong> {item.feedback.feedback}</p>}
                      </div>
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold">Company interview history</h1>
                <p className="mt-2 text-sm text-black/50">Review past companies, your answers, and example strong answers.</p>
                {historyLoading && <p className="mt-6 text-sm text-black/50">Loading history…</p>}
                {historyError && <p role="alert" className="mt-5 text-sm text-red-600">{historyError}</p>}
                {!historyLoading && !historyError && history.length === 0 && <p className="mt-6 rounded-xl bg-black/3 p-5 text-sm text-black/55">No company interviews yet. Completed and in-progress sessions will appear here.</p>}
                <div className="mt-5 space-y-3">
                  {history.map((item) => (
                    <button key={item._id} onClick={() => openHistoryItem(item._id)} className="flex w-full items-center justify-between gap-4 rounded-2xl border border-black/8 p-4 text-left transition hover:border-black/25 hover:bg-black/2">
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">{item.company} · {item.role}</span>
                        <span className="mt-1 block text-xs capitalize text-black/45">{item.type} · {new Date(item.createdAt).toLocaleDateString()} · {item.status}</span>
                      </span>
                      <span className="shrink-0 text-sm font-semibold text-black/60">{item.status === "completed" ? `${item.overallScore}/100` : `${item.currentQuestion}/${item.questions?.length ?? 0}`}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </section>
        ) : !interview ? (
          <form onSubmit={startInterview} className="rounded-3xl border border-black/8 bg-white p-6 shadow-sm sm:p-9">
            <div className="mb-7 flex items-start gap-4">
              <div className="rounded-2xl bg-black p-3 text-white"><FiBriefcase size={22} /></div>
              <div>
                <h1 className="text-2xl font-bold sm:text-3xl">Company Interview Simulator</h1>
                <p className="mt-2 text-sm leading-6 text-black/55">Practice original role-specific questions inspired by broad, publicly known hiring themes—not actual or confidential company questions.</p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Company
                <select value={company} onChange={(event) => setCompany(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-black/15 bg-white px-3 outline-none focus:border-black">
                  {COMPANIES.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              {company === "Other" && (
                <label className="text-sm font-medium">
                  Company name
                  <input value={customCompany} onChange={(event) => setCustomCompany(event.target.value)} maxLength={80} required className="mt-2 h-11 w-full rounded-xl border border-black/15 px-3 outline-none focus:border-black" placeholder="Enter a company" />
                </label>
              )}
              <label className="text-sm font-medium">
                Target role
                <input value={role} onChange={(event) => setRole(event.target.value)} maxLength={100} required className="mt-2 h-11 w-full rounded-xl border border-black/15 px-3 outline-none focus:border-black" placeholder="Backend Developer" />
              </label>
              <fieldset className="text-sm font-medium">
                Interview type
                <div className="mt-2 flex rounded-xl border border-black/10 bg-black/3 p-1">
                  {["technical", "hr"].map((option) => (
                    <button key={option} type="button" onClick={() => setType(option)} className={`h-9 flex-1 rounded-lg capitalize ${type === option ? "bg-black text-white" : "text-black/55"}`}>
                      {option}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>

            {Boolean(resume) && (
              <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-xl border border-black/10 p-4 text-sm">
                <input type="checkbox" checked={useResume} onChange={(event) => setUseResume(event.target.checked)} className="accent-black" />
                Personalize questions using my saved resume
              </label>
            )}
            {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}
            <button disabled={loading || !role.trim() || (company === "Other" && !customCompany.trim())} className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-black font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? <><FiLoader className="animate-spin" /> Preparing interview…</> : "Start interview · 50 coins"}
            </button>
            <p className="mt-3 text-center text-xs text-black/40">Five questions, answer-by-answer coaching, and a final scorecard.</p>
          </form>
        ) : interview.status === "completed" ? (
          <section className="rounded-3xl border border-black/8 bg-white p-6 shadow-sm sm:p-9">
            <div className="flex items-center gap-3">
              <FiCheckCircle className="text-emerald-600" size={26} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-black/40">Practice complete · {interview.company}</p>
                <h1 className="text-2xl font-bold">{interview.role} scorecard</h1>
              </div>
              <div className="ml-auto text-3xl font-extrabold">{interview.overallScore}<span className="text-base text-black/35">/100</span></div>
            </div>
            <p className="mt-6 leading-7 text-black/65">{interview.summary}</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[["Strengths", interview.strengths], ["Focus areas", interview.weaknesses], ["Next steps", interview.recommendations]].map(([title, items]) => (
                <div key={title} className="rounded-2xl bg-black/3 p-4">
                  <h2 className="font-semibold">{title}</h2>
                  <ul className="mt-2 list-inside list-disc space-y-1.5 text-sm text-black/60">{items.map((item, index) => <li key={`${title}-${index}`}>{item}</li>)}</ul>
                </div>
              ))}
            </div>
            <button onClick={reset} className="mt-7 h-11 w-full rounded-xl bg-black font-semibold text-white">Practice another company</button>
          </section>
        ) : (
          <section className="rounded-3xl border border-black/8 bg-white p-6 shadow-sm sm:p-9">
            <p className="text-xs font-semibold uppercase tracking-wider text-black/40">{interview.company} · {interview.role} · {interview.type}</p>
            <div className="mt-2 flex items-center justify-between">
              <h1 className="text-xl font-bold">Question {interview.currentQuestion + 1} of {interview.questions.length}</h1>
              <span className="rounded-full bg-black/5 px-3 py-1 text-xs capitalize">{interview.questions[interview.currentQuestion]?.difficulty}</span>
            </div>
            <div className="mt-6 flex gap-3 rounded-2xl bg-black/[0.035] p-5">
              <FiMessageSquare className="mt-1 shrink-0" />
              <p className="leading-7">{interview.questions[interview.currentQuestion]?.question}</p>
            </div>

            {lastFeedback && (
              <div className="mt-5 rounded-2xl border border-emerald-900/10 bg-emerald-50 p-4">
                <div className="flex items-center justify-between font-semibold"><span>Answer feedback</span><span>{lastFeedback.score}/100</span></div>
                <p className="mt-2 text-sm leading-6 text-black/65">{lastFeedback.feedback}</p>
                <ul className="mt-2 list-inside list-disc text-sm text-black/55">{lastFeedback.improvements.map((item, index) => <li key={index}>{item}</li>)}</ul>
              </div>
            )}

            <form onSubmit={submitAnswer}>
              <label className="mt-5 block text-sm font-medium">
                Your answer
                <textarea value={answer} onChange={(event) => setAnswer(event.target.value)} rows={6} maxLength={10000} required className="mt-2 w-full resize-y rounded-xl border border-black/15 p-4 leading-6 outline-none focus:border-black" placeholder="Structure your answer clearly. Include your reasoning and examples." />
              </label>
              {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
              <button disabled={loading || !answer.trim()} className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-black font-semibold text-white disabled:opacity-50">
                {loading ? <><FiLoader className="animate-spin" /> Evaluating answer…</> : "Submit answer"}
              </button>
            </form>
          </section>
        )}
      </div>
    </div>
  );
}

export default CompanyInterview;
