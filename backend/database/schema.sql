--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

-- Started on 2026-05-25 20:23:04

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 237 (class 1255 OID 24692)
-- Name: update_pantry_status(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_pantry_status() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Always calculate status, no exceptions
  IF NEW.expiry_date IS NULL THEN
    NEW.status := 'fresh';
  ELSE
    -- Compare dates directly
    IF NEW.expiry_date < CURRENT_DATE THEN
      NEW.status := 'expired';
    ELSIF NEW.expiry_date <= (CURRENT_DATE + 3) THEN
      NEW.status := 'expiring_soon';
    ELSE
      NEW.status := 'fresh';
    END IF;
  END IF;
  
  -- Always update timestamp
  NEW.updated_at := CURRENT_TIMESTAMP;
  
  -- Debug output
  RAISE NOTICE 'Item: % | Expiry: % | Today: % | Status: %', 
    NEW.item_name, NEW.expiry_date, CURRENT_DATE, NEW.status;
  
  RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 230 (class 1259 OID 24745)
-- Name: admin_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_logs (
    id integer NOT NULL,
    admin_id integer NOT NULL,
    action character varying(100) NOT NULL,
    target_type character varying(50),
    target_id integer,
    details jsonb,
    ip_address character varying(45),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 229 (class 1259 OID 24744)
-- Name: admin_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.admin_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5064 (class 0 OID 0)
-- Dependencies: 229
-- Name: admin_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.admin_logs_id_seq OWNED BY public.admin_logs.id;


--
-- TOC entry 224 (class 1259 OID 24650)
-- Name: ai_recommendations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_recommendations (
    id integer NOT NULL,
    user_id integer NOT NULL,
    meal_template_id integer,
    recommended_meal_name character varying(255) NOT NULL,
    meal_type character varying(50) NOT NULL,
    calories numeric(8,2),
    protein numeric(8,2),
    carbs numeric(8,2),
    fats numeric(8,2),
    reason text NOT NULL,
    confidence_score integer,
    was_accepted boolean DEFAULT false,
    was_rejected boolean DEFAULT false,
    user_feedback text,
    recommended_for_date date,
    nutritional_gap_protein numeric(8,2),
    nutritional_gap_calories numeric(8,2),
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT ai_recommendations_confidence_score_check CHECK (((confidence_score >= 0) AND (confidence_score <= 100)))
);


--
-- TOC entry 223 (class 1259 OID 24649)
-- Name: ai_recommendations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ai_recommendations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5065 (class 0 OID 0)
-- Dependencies: 223
-- Name: ai_recommendations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ai_recommendations_id_seq OWNED BY public.ai_recommendations.id;


--
-- TOC entry 228 (class 1259 OID 24695)
-- Name: homecook_applications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.homecook_applications (
    id integer NOT NULL,
    user_id integer NOT NULL,
    application_text text NOT NULL,
    specialties text[],
    experience_years integer DEFAULT 0,
    sample_dishes text[],
    certifications text,
    status character varying(20) DEFAULT 'pending'::character varying,
    applied_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    reviewed_at timestamp without time zone,
    reviewed_by integer,
    rejection_reason text,
    CONSTRAINT homecook_applications_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])))
);


--
-- TOC entry 227 (class 1259 OID 24694)
-- Name: homecook_applications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.homecook_applications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5066 (class 0 OID 0)
-- Dependencies: 227
-- Name: homecook_applications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.homecook_applications_id_seq OWNED BY public.homecook_applications.id;


--
-- TOC entry 232 (class 1259 OID 24764)
-- Name: homecook_recipes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.homecook_recipes (
    id integer NOT NULL,
    user_id integer NOT NULL,
    recipe_name character varying(255) NOT NULL,
    description text,
    cuisine_type character varying(100) DEFAULT 'Other'::character varying,
    price numeric(10,2) NOT NULL,
    prep_time_minutes integer DEFAULT 30,
    servings integer DEFAULT 2,
    ingredients text[],
    instructions text[],
    is_vegan boolean DEFAULT false,
    is_vegetarian boolean DEFAULT false,
    is_gluten_free boolean DEFAULT false,
    is_dairy_free boolean DEFAULT false,
    is_available boolean DEFAULT true,
    image_url text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 231 (class 1259 OID 24763)
-- Name: homecook_recipes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.homecook_recipes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5067 (class 0 OID 0)
-- Dependencies: 231
-- Name: homecook_recipes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.homecook_recipes_id_seq OWNED BY public.homecook_recipes.id;


--
-- TOC entry 222 (class 1259 OID 24637)
-- Name: meal_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.meal_templates (
    id integer NOT NULL,
    meal_name character varying(255) NOT NULL,
    meal_type character varying(50) NOT NULL,
    description text,
    calories numeric(8,2) NOT NULL,
    protein numeric(8,2) NOT NULL,
    carbs numeric(8,2) NOT NULL,
    fats numeric(8,2) NOT NULL,
    cuisine_type character varying(100),
    dietary_tags text[],
    estimated_cost numeric(6,2),
    prep_time_minutes integer,
    ingredients text[],
    active boolean DEFAULT true,
    popularity_score integer DEFAULT 50,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT meal_templates_meal_type_check CHECK (((meal_type)::text = ANY ((ARRAY['breakfast'::character varying, 'lunch'::character varying, 'dinner'::character varying, 'snack'::character varying])::text[])))
);


--
-- TOC entry 221 (class 1259 OID 24636)
-- Name: meal_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.meal_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5068 (class 0 OID 0)
-- Dependencies: 221
-- Name: meal_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.meal_templates_id_seq OWNED BY public.meal_templates.id;


--
-- TOC entry 220 (class 1259 OID 16405)
-- Name: meals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.meals (
    id integer NOT NULL,
    user_id integer NOT NULL,
    meal_date date NOT NULL,
    meal_type character varying(50) NOT NULL,
    meal_name character varying(255) NOT NULL,
    description text,
    calories numeric(10,2) DEFAULT 0,
    protein numeric(10,2) DEFAULT 0,
    carbs numeric(10,2) DEFAULT 0,
    fats numeric(10,2) DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT meals_meal_type_check CHECK (((meal_type)::text = ANY ((ARRAY['breakfast'::character varying, 'lunch'::character varying, 'dinner'::character varying, 'snack'::character varying])::text[])))
);


--
-- TOC entry 219 (class 1259 OID 16404)
-- Name: meals_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.meals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5069 (class 0 OID 0)
-- Dependencies: 219
-- Name: meals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.meals_id_seq OWNED BY public.meals.id;


--
-- TOC entry 234 (class 1259 OID 32956)
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    buyer_id integer NOT NULL,
    homecook_id integer NOT NULL,
    recipe_id integer NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    total_price numeric(10,2) NOT NULL,
    pickup_time timestamp without time zone,
    special_requests text,
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    buyer_phone_snapshot character varying(20),
    homecook_phone_snapshot character varying(20)
);


--
-- TOC entry 233 (class 1259 OID 32955)
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5070 (class 0 OID 0)
-- Dependencies: 233
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- TOC entry 226 (class 1259 OID 24676)
-- Name: pantry_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pantry_items (
    id integer NOT NULL,
    user_id integer NOT NULL,
    item_name character varying(255) NOT NULL,
    category character varying(100),
    quantity numeric(10,2),
    unit character varying(50),
    purchase_date date,
    expiry_date date,
    storage_location character varying(100),
    notes text,
    status character varying(20),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 225 (class 1259 OID 24675)
-- Name: pantry_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pantry_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5071 (class 0 OID 0)
-- Dependencies: 225
-- Name: pantry_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pantry_items_id_seq OWNED BY public.pantry_items.id;


--
-- TOC entry 236 (class 1259 OID 32985)
-- Name: reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reviews (
    id integer NOT NULL,
    order_id integer NOT NULL,
    recipe_id integer,
    reviewer_id integer NOT NULL,
    rating integer NOT NULL,
    review_text text,
    review_type character varying(50) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- TOC entry 235 (class 1259 OID 32984)
-- Name: reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5072 (class 0 OID 0)
-- Dependencies: 235
-- Name: reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reviews_id_seq OWNED BY public.reviews.id;


--
-- TOC entry 218 (class 1259 OID 16389)
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    full_name character varying(255) NOT NULL,
    role character varying(50) DEFAULT 'consumer'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    age integer,
    gender character varying(20),
    weight numeric(5,2),
    height numeric(5,2),
    activity_level character varying(50),
    health_goals text[],
    dietary_preferences text[],
    allergies text[],
    preferred_cuisines text[],
    prioritize_local boolean DEFAULT false,
    daily_budget numeric(10,2),
    weekly_budget numeric(10,2),
    shopping_style character varying(50),
    pantry_tracking boolean DEFAULT true,
    leftover_alerts boolean DEFAULT true,
    expiry_notifications boolean DEFAULT true,
    preferred_serving_size integer DEFAULT 2,
    marketplace_access boolean DEFAULT false,
    personalization_strength integer DEFAULT 75,
    nutrition_focus text[],
    ai_auto_adjust boolean DEFAULT true,
    email_notifications boolean DEFAULT true,
    sms_notifications boolean DEFAULT false,
    data_sharing boolean DEFAULT false,
    profile_image_url character varying(500),
    ai_personalization_strength integer DEFAULT 75,
    enable_ai_suggestions boolean DEFAULT true,
    enable_email_notifications boolean DEFAULT true,
    enable_sms_notifications boolean DEFAULT false,
    allow_data_sharing boolean DEFAULT false,
    onboarding_completed boolean DEFAULT false,
    onboarding_step integer DEFAULT 0,
    homecook_status character varying(20) DEFAULT 'not_applied'::character varying,
    homecook_approved boolean DEFAULT false,
    pickup_lat numeric(10,7),
    pickup_lng numeric(10,7),
    pickup_address text,
    phone_number character varying(20),
    phone_verified boolean DEFAULT false,
    phone_verified_at timestamp without time zone,
    phone_verified_by integer,
    phone_verification_notes text,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['consumer'::character varying, 'homecook'::character varying, 'admin'::character varying])::text[])))
);


--
-- TOC entry 217 (class 1259 OID 16388)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5073 (class 0 OID 0)
-- Dependencies: 217
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 4835 (class 2604 OID 24748)
-- Name: admin_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_logs ALTER COLUMN id SET DEFAULT nextval('public.admin_logs_id_seq'::regclass);


--
-- TOC entry 4824 (class 2604 OID 24653)
-- Name: ai_recommendations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_recommendations ALTER COLUMN id SET DEFAULT nextval('public.ai_recommendations_id_seq'::regclass);


--
-- TOC entry 4831 (class 2604 OID 24698)
-- Name: homecook_applications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.homecook_applications ALTER COLUMN id SET DEFAULT nextval('public.homecook_applications_id_seq'::regclass);


--
-- TOC entry 4837 (class 2604 OID 24767)
-- Name: homecook_recipes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.homecook_recipes ALTER COLUMN id SET DEFAULT nextval('public.homecook_recipes_id_seq'::regclass);


--
-- TOC entry 4820 (class 2604 OID 24640)
-- Name: meal_templates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meal_templates ALTER COLUMN id SET DEFAULT nextval('public.meal_templates_id_seq'::regclass);


--
-- TOC entry 4813 (class 2604 OID 16408)
-- Name: meals id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meals ALTER COLUMN id SET DEFAULT nextval('public.meals_id_seq'::regclass);


--
-- TOC entry 4848 (class 2604 OID 32959)
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- TOC entry 4828 (class 2604 OID 24679)
-- Name: pantry_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pantry_items ALTER COLUMN id SET DEFAULT nextval('public.pantry_items_id_seq'::regclass);


--
-- TOC entry 4853 (class 2604 OID 32988)
-- Name: reviews id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews ALTER COLUMN id SET DEFAULT nextval('public.reviews_id_seq'::regclass);


--
-- TOC entry 4788 (class 2604 OID 16392)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 4885 (class 2606 OID 24753)
-- Name: admin_logs admin_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_logs
    ADD CONSTRAINT admin_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 4875 (class 2606 OID 24661)
-- Name: ai_recommendations ai_recommendations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_recommendations
    ADD CONSTRAINT ai_recommendations_pkey PRIMARY KEY (id);


--
-- TOC entry 4881 (class 2606 OID 24706)
-- Name: homecook_applications homecook_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.homecook_applications
    ADD CONSTRAINT homecook_applications_pkey PRIMARY KEY (id);


--
-- TOC entry 4883 (class 2606 OID 24708)
-- Name: homecook_applications homecook_applications_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.homecook_applications
    ADD CONSTRAINT homecook_applications_user_id_key UNIQUE (user_id);


--
-- TOC entry 4888 (class 2606 OID 24781)
-- Name: homecook_recipes homecook_recipes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.homecook_recipes
    ADD CONSTRAINT homecook_recipes_pkey PRIMARY KEY (id);


--
-- TOC entry 4873 (class 2606 OID 24648)
-- Name: meal_templates meal_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meal_templates
    ADD CONSTRAINT meal_templates_pkey PRIMARY KEY (id);


--
-- TOC entry 4870 (class 2606 OID 16419)
-- Name: meals meals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meals
    ADD CONSTRAINT meals_pkey PRIMARY KEY (id);


--
-- TOC entry 4892 (class 2606 OID 32967)
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- TOC entry 4879 (class 2606 OID 24686)
-- Name: pantry_items pantry_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pantry_items
    ADD CONSTRAINT pantry_items_pkey PRIMARY KEY (id);


--
-- TOC entry 4895 (class 2606 OID 32997)
-- Name: reviews reviews_order_id_reviewer_id_review_type_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_order_id_reviewer_id_review_type_key UNIQUE (order_id, reviewer_id, review_type);


--
-- TOC entry 4897 (class 2606 OID 32995)
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- TOC entry 4865 (class 2606 OID 16402)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4867 (class 2606 OID 16400)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4886 (class 1259 OID 24762)
-- Name: idx_admin_logs_admin_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_logs_admin_id ON public.admin_logs USING btree (admin_id);


--
-- TOC entry 4876 (class 1259 OID 24672)
-- Name: idx_ai_recommendations_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_recommendations_date ON public.ai_recommendations USING btree (recommended_for_date);


--
-- TOC entry 4877 (class 1259 OID 24673)
-- Name: idx_ai_recommendations_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_recommendations_user ON public.ai_recommendations USING btree (user_id);


--
-- TOC entry 4889 (class 1259 OID 24788)
-- Name: idx_homecook_recipes_cuisine; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_homecook_recipes_cuisine ON public.homecook_recipes USING btree (cuisine_type);


--
-- TOC entry 4871 (class 1259 OID 24674)
-- Name: idx_meal_templates_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_meal_templates_active ON public.meal_templates USING btree (active);


--
-- TOC entry 4868 (class 1259 OID 16425)
-- Name: idx_meals_user_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_meals_user_date ON public.meals USING btree (user_id, meal_date);


--
-- TOC entry 4890 (class 1259 OID 32983)
-- Name: idx_orders_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_status ON public.orders USING btree (status);


--
-- TOC entry 4893 (class 1259 OID 33013)
-- Name: idx_reviews_reviewer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_reviewer ON public.reviews USING btree (reviewer_id);


--
-- TOC entry 4862 (class 1259 OID 16403)
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- TOC entry 4863 (class 1259 OID 16437)
-- Name: idx_users_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_id ON public.users USING btree (id);


--
-- TOC entry 4913 (class 2620 OID 24693)
-- Name: pantry_items pantry_status_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER pantry_status_trigger BEFORE INSERT OR UPDATE ON public.pantry_items FOR EACH ROW EXECUTE FUNCTION public.update_pantry_status();


--
-- TOC entry 4905 (class 2606 OID 24754)
-- Name: admin_logs admin_logs_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_logs
    ADD CONSTRAINT admin_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users(id);


--
-- TOC entry 4900 (class 2606 OID 24667)
-- Name: ai_recommendations ai_recommendations_meal_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_recommendations
    ADD CONSTRAINT ai_recommendations_meal_template_id_fkey FOREIGN KEY (meal_template_id) REFERENCES public.meal_templates(id) ON DELETE SET NULL;


--
-- TOC entry 4901 (class 2606 OID 24662)
-- Name: ai_recommendations ai_recommendations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_recommendations
    ADD CONSTRAINT ai_recommendations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4903 (class 2606 OID 24714)
-- Name: homecook_applications homecook_applications_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.homecook_applications
    ADD CONSTRAINT homecook_applications_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id);


--
-- TOC entry 4904 (class 2606 OID 24709)
-- Name: homecook_applications homecook_applications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.homecook_applications
    ADD CONSTRAINT homecook_applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4906 (class 2606 OID 24782)
-- Name: homecook_recipes homecook_recipes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.homecook_recipes
    ADD CONSTRAINT homecook_recipes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4899 (class 2606 OID 16420)
-- Name: meals meals_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meals
    ADD CONSTRAINT meals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4907 (class 2606 OID 32968)
-- Name: orders orders_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4908 (class 2606 OID 32973)
-- Name: orders orders_homecook_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_homecook_id_fkey FOREIGN KEY (homecook_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4909 (class 2606 OID 32978)
-- Name: orders orders_recipe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES public.homecook_recipes(id) ON DELETE CASCADE;


--
-- TOC entry 4902 (class 2606 OID 24687)
-- Name: pantry_items pantry_items_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pantry_items
    ADD CONSTRAINT pantry_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4910 (class 2606 OID 32998)
-- Name: reviews reviews_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- TOC entry 4911 (class 2606 OID 33003)
-- Name: reviews reviews_recipe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES public.homecook_recipes(id) ON DELETE SET NULL;


--
-- TOC entry 4912 (class 2606 OID 33008)
-- Name: reviews reviews_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4898 (class 2606 OID 33019)
-- Name: users users_phone_verified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_phone_verified_by_fkey FOREIGN KEY (phone_verified_by) REFERENCES public.users(id);


-- Completed on 2026-05-25 20:23:04

--
-- PostgreSQL database dump complete
--

